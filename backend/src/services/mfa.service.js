// src/services/mfa.service.js
// MFA service layer

const { prisma } = require('../../config/database');
const {
  generateMFASecret,
  generateQRCode,
  verifyMFAToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} = require('../utility/mfa');
const { withAudit } = require('../utility/auditLogger');
const config = require('../../config/env');

class MFAService {
  /**
   * Setup MFA for user (generates secret and QR code)
   */
  async setupMFA(userId, context = {}) {
    return withAudit('MFA_SETUP', userId, async () => {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.mfaEnabled) {
        throw new Error('MFA is already enabled');
      }

      // Generate secret
      const { secret, otpauthUrl } = generateMFASecret(user.email);

      // Generate QR code
      const qrCode = await generateQRCode(otpauthUrl);

      // Generate backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

      // Save secret to database (but don't enable yet - user must verify first)
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret: secret,
          mfaBackupCodes: hashedBackupCodes,
          mfaEnabled: false, // Not enabled until verified
          mfaVerified: false,
        },
      });

      return {
        secret: secret, // Show once to user
        qrCode: qrCode, // Data URL for QR code image
        backupCodes: backupCodes, // Show once - user must save these!
      };
    }, context);
  }

  /**
   * Verify MFA setup (user must provide valid code to enable)
   */
  async verifyMFASetup(userId, token, context = {}) {
    return withAudit('MFA_VERIFY_SETUP', userId, async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.mfaSecret) {
        throw new Error('MFA not set up');
      }

      if (user.mfaEnabled) {
        throw new Error('MFA already enabled');
      }

      // Verify token
      const isValid = verifyMFAToken(token, user.mfaSecret);

      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Enable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
          mfaVerified: true,
        },
      });

      return {
        success: true,
        message: '2FA enabled successfully',
      };
    }, context);
  }

  /**
   * Verify MFA token during login
   */
  async verifyMFALogin(userId, token, context = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new Error('MFA not enabled for this user');
    }

    // Try TOTP token first
    const isTOTPValid = verifyMFAToken(token, user.mfaSecret);

    if (isTOTPValid) {
      await withAudit('MFA_LOGIN_SUCCESS', userId, async () => {
        return { success: true };
      }, context);
      return { success: true, method: 'TOTP' };
    }

    // Try backup code
    const backupResult = verifyBackupCode(token, user.mfaBackupCodes);

    if (backupResult.valid) {
      // Update remaining backup codes
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaBackupCodes: backupResult.remainingCodes,
        },
      });

      await withAudit('MFA_LOGIN_BACKUP_CODE', userId, async () => {
        return { success: true };
      }, { ...context, metadata: { remainingCodes: backupResult.remainingCodes.length } });

      return {
        success: true,
        method: 'BACKUP_CODE',
        remainingCodes: backupResult.remainingCodes.length,
      };
    }

    // Both failed
    await withAudit('MFA_LOGIN_FAILURE', userId, async () => {
      throw new Error('Invalid verification code');
    }, context);

    throw new Error('Invalid 2FA code');
  }

  /**
   * Disable MFA (requires current password + MFA code)
   */
  async disableMFA(userId, password, token, context = {}) {
    return withAudit('MFA_DISABLE', userId, async () => {
      const { comparePassword } = require('../utility/password');

      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Invalid password');
      }

      // Verify MFA token
      if (user.mfaEnabled) {
        const isValid = verifyMFAToken(token, user.mfaSecret);
        if (!isValid) {
          throw new Error('Invalid 2FA code');
        }
      }

      // Disable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: null,
          mfaVerified: false,
        },
      });

      return {
        success: true,
        message: '2FA disabled successfully',
      };
    }, context);
  }

  /**
   * Check if MFA is required for user's role
   */
  isMFARequiredForRole(role) {
    return config.mfa.requiredRoles.includes(role);
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId, context = {}) {
    return withAudit('MFA_REGENERATE_BACKUP_CODES', userId, async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || !user.mfaEnabled) {
        throw new Error('MFA not enabled');
      }

      // Generate new backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code));

      // Update in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaBackupCodes: hashedBackupCodes,
        },
      });

      return {
        backupCodes: backupCodes, // Show once - user must save!
      };
    }, context);
  }
}

module.exports = new MFAService();