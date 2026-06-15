// Authentication service with production-grade security

const { prisma } = require('../../config/database');
const { hashPassword, comparePassword } = require('../../src/utility/password');
const { 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  hashToken,
} = require('../utility/token');
const { withAudit } = require('../utility/auditLogger');
const { unauthorized, locked } = require('../utility/errors');
const { sendVerificationEmail } = require('../utility/mail');
const config = require('../../config/env');

class AuthService {
  /**
   * Register new user
   * Using transaction to ensure atomicity
   */
  async register(userData, context = {}) {
    const { email, password, firstName, lastName, role, department, clearanceLevel } = userData;

    return withAudit('REGISTER', null, async () => {
      // Use transaction for atomic operation
      return await prisma.$transaction(async (tx) => {
        // Check if user already exists
        const existingUser = await tx.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        // Validate email domain
        const allowedDomain = `@gmail.com`;
        if (!email.toLowerCase().endsWith(allowedDomain)) {
          throw new Error(`Only Gmail (@gmail.com) email addresses allowed`);
        }

        // Hash password (UK Cyber Essentials requirement)
        const passwordHash = await hashPassword(password);

        // Generate email verification token
        const emailVerificationToken = generateRandomToken();
        const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = await tx.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            firstName,
            lastName,
            role: role || 'STUDENT',
            department,
            clearanceLevel: clearanceLevel || 'PUBLIC',
            emailVerificationToken,
            emailVerificationExpiry,
            isVerified: false, // Always false on registration, requiring verification link
            termsAcceptedAt: new Date(), // GDPR: Terms acceptance
          },
        });

        if (config.email.enabled) {
          await sendVerificationEmail(user.email, emailVerificationToken);
        }

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          department: user.department,
          clearanceLevel: user.clearanceLevel,
          isVerified: user.isVerified,
          needsEmailVerification: !user.isVerified,
          isMfaEnabled: false,
        };
      });
    }, context);
  }

  /**
   * Login user with account lockout protection
   * Uses transaction for failed attempt tracking
   */
  async login(email, password, context = {}, mfaToken = null) {
    const { ipAddress, userAgent, location } = context;

    // Find user first (outside transaction for better error messages)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Log failed attempt for non-existent user
      await withAudit('LOGIN', null, async () => {
        throw unauthorized('Invalid email or password');
      }, { ipAddress, userAgent, metadata: { email } });
      
      throw unauthorized('Invalid email or password');
    }

    // Check if account is locked
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 1000 / 60);
      throw new Error(`Account locked. Try again in ${minutesLeft} minutes`);
    }

    // Clear lock if expired
    if (user.isLocked && user.lockedUntil && user.lockedUntil <= new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isLocked: false,
          lockedUntil: null,
          failedLoginAttempts: 0,
        },
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= config.security.maxLoginAttempts;

      await prisma.$transaction(async (tx) => {
        // Update user
        await tx.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lastFailedLogin: new Date(),
            isLocked: shouldLock,
            lockedUntil: shouldLock 
              ? new Date(Date.now() + config.security.lockoutDuration * 60 * 1000)
              : null,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: user.id,
            action: 'LOGIN',
            result: 'FAILURE',
            ipAddress,
            userAgent,
            metadata: {
              reason: 'Invalid password',
              failedAttempts,
              accountLocked: shouldLock,
            },
          },
        });
      });

      if (shouldLock) {
        throw locked(
          `Account locked due to too many failed attempts. Try again in ${config.security.lockoutDuration} minutes`
        );
      }

      throw unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Check email verification status
    if (!user.isVerified) {
      throw unauthorized('Please verify your email address before logging in');
    }

    // SUCCESSFUL LOGIN - Wrap in audit
    return withAudit('LOGIN', user.id, async () => {
      // Use transaction for token creation + user update
      return await prisma.$transaction(async (tx) => {
        // Generate JWT tokens
        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
          department: user.department,
          clearanceLevel: user.clearanceLevel,
        };

        // Check if MFA is enabled
      if (user.mfaEnabled) {
        // If no MFA token provided, indicate MFA required
        if (!mfaToken) {
          return {
            mfaRequired: true,
            userId: user.id, // Temporary - for next step
            message: 'Please provide 2FA code',
          };
        }

        // Verify MFA token
        const mfaService = require('./mfa.service');
        try {
          const mfaResult = await mfaService.verifyMFALogin(
            user.id,
            mfaToken,
            context
          );

          // If backup code used, include warning
          if (mfaResult.method === 'BACKUP_CODE') {
            context.metadata = {
              ...context.metadata,
              backupCodeUsed: true,
              remainingCodes: mfaResult.remainingCodes,
            };
          }
        } catch (error) {
          // MFA verification failed
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'LOGIN_MFA_FAILED',
              result: 'FAILURE',
              ipAddress: context.ipAddress,
              userAgent: context.userAgent,
              metadata: { reason: error.message },
            },
          });

          throw new Error('Invalid 2FA code');
        }
      }

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
        const refreshTokenHash = hashToken(refreshToken);

        // Save refresh token (hashed for security)
        const expiryDays = user.role === 'STUDENT' ? 7 : 30;
        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: refreshTokenHash,
            expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000),
            ipAddress,
            userAgent,
          },
        });

        // Update user login info
        await tx.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0, // Reset on successful login
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress,
            lastLoginLocation: location || 'UNKNOWN',
          },
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            department: user.department,
            clearanceLevel: user.clearanceLevel,
            isVerified: user.isVerified,
            isMfaEnabled: user.mfaEnabled,
          },
          accessToken,
          refreshToken,
        };
      });
    }, { ipAddress, userAgent, metadata: { location } });
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    // Check if refresh token exists and is valid
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revokedAt) {
      throw new Error('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Generate new access token
    const tokenPayload = {
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
      department: storedToken.user.department,
      clearanceLevel: storedToken.user.clearanceLevel,
    };

    const accessToken = generateAccessToken(tokenPayload);

    return { accessToken };
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken, context = {}) {
    if (!refreshToken) {
      return { success: true };
    }

    const tokenHash = hashToken(refreshToken);

    // Get token to find user ID for audit
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    return withAudit('LOGOUT', token?.userId, async () => {
      // Revoke refresh token
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });

      return { success: true };
    }, context);
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, currentPassword, newPassword, context = {}) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) throw unauthorized('Current password is incorrect');

    const isSame = await comparePassword(newPassword, user.passwordHash);
    if (isSame) throw new Error('New password must be different from your current password');

    const passwordHash = await hashPassword(newPassword);

    return withAudit('PASSWORD_CHANGE', userId, async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash, lastPasswordChange: new Date() },
      });
      return { success: true, message: 'Password changed successfully' };
    }, context);
  }

  /**
   * Verify email
   */
  async verifyEmail(token) {
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return { success: true, message: 'Email verified successfully' };
  }
}

module.exports = new AuthService();