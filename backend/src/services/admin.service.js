// src/services/admin.service.js
// Admin user management service

const { prisma } = require('../../config/database');
const { hashPassword } = require('../utility/password');
const { generateRandomToken } = require('../utility/token');
const { withAudit } = require('../utility/auditLogger');
const { sendPasswordSetupEmail } = require('../utility/mail');
const config = require('../../config/env');

class AdminService {
  /**
   * Create new user (admin/staff only)
   * User gets email with setup link to choose password
   */
  async createUser(userData, creatorId, creatorRole, context = {}) {
    return withAudit('ADMIN_CREATE_USER', creatorId, async () => {
      const {
        email,
        firstName,
        lastName,
        role,
        department,
        clearanceLevel,
      } = userData;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
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

      // Generate temporary password setup token
      const setupToken = generateRandomToken();
      const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Determine account status based on creator role
      let accountStatus = 'ACTIVE';
      let isVerified = true;

      if (creatorRole === 'STAFF') {
        // Staff-created users need admin approval
        accountStatus = 'PENDING_APPROVAL';
        isVerified = false;
      }

      // Create temporary password (will be changed on first login)
      const tempPassword = generateRandomToken().substring(0, 12);
      const passwordHash = await hashPassword(tempPassword);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash, // Temporary
          firstName,
          lastName,
          role: role || 'STUDENT',
          department,
          clearanceLevel: clearanceLevel || 'PUBLIC',
          isVerified,
          isActive: accountStatus === 'ACTIVE',
          passwordResetToken: setupToken, // Used for password setup
          passwordResetExpiry: setupTokenExpiry,
          termsAcceptedAt: new Date(),
        },
      });

      if (config.email.enabled) {
        await sendPasswordSetupEmail(user.email, setupToken);
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        clearanceLevel: user.clearanceLevel,
        accountStatus: accountStatus,
        setupToken: setupToken, // Return for testing (remove in production)
        message: creatorRole === 'STAFF' 
          ? 'User created. Pending admin approval.'
          : 'User created. Setup email sent.',
      };
    }, context);
  }

  /**
   * Approve pending user (admin only)
   */
  async approveUser(userId, approverId, context = {}) {
    return withAudit('ADMIN_APPROVE_USER', approverId, async () => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      if (user.isActive && user.isVerified) {
        throw new Error('User is already approved');
      }

      // Approve user
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          isVerified: true,
        },
      });

      // TODO: Send approval email
      // await sendApprovalEmail(user.email);

      return {
        success: true,
        message: 'User approved successfully',
      };
    }, context);
  }

  /**
   * List pending users (for admin review)
   */
  async listPendingUsers() {
    return await prisma.user.findMany({
      where: {
        isActive: false,
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Setup password (user's first login)
   */
  async setupPassword(token, newPassword, context = {}) {
    // Find user by setup token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired setup token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        lastPasswordChange: new Date(),
      },
    });

    return withAudit('PASSWORD_SETUP', user.id, async () => {
      return {
        success: true,
        message: 'Password set successfully. You can now login.',
      };
    }, context);
  }
}

module.exports = new AdminService();