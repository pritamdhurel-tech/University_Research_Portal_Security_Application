// MFA HTTP controllers

const mfaService = require('../services/mfa.service');

class MFAController {
  /**
   * Setup MFA (generate QR code and backup codes)
   * POST /api/mfa/setup
   */
  async setupMFA(req, res, next) {
    try {
      const result = await mfaService.setupMFA(req.user.id, req.context);

      res.json({
        success: true,
        message: 'MFA setup initiated. Scan QR code with authenticator app.',
        data: {
          qrCode: result.qrCode,
          secret: result.secret, // Manual entry if QR doesn't work
          backupCodes: result.backupCodes, // IMPORTANT: User must save these!
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify MFA setup
   * POST /api/mfa/verify-setup
   */
  async verifySetup(req, res, next) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: '2FA code is required',
        });
      }

      const result = await mfaService.verifyMFASetup(
        req.user.id,
        token,
        req.context
      );

      res.json({
        success: true,
        message: '2FA enabled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disable MFA
   * POST /api/mfa/disable
   */
  async disableMFA(req, res, next) {
    try {
      const { password, token } = req.body;

      if (!password || !token) {
        return res.status(400).json({
          success: false,
          message: 'Password and 2FA code are required',
        });
      }

      const result = await mfaService.disableMFA(
        req.user.id,
        password,
        token,
        req.context
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate backup codes
   * POST /api/mfa/regenerate-codes
   */
  async regenerateBackupCodes(req, res, next) {
    try {
      const result = await mfaService.regenerateBackupCodes(
        req.user.id,
        req.context
      );

      res.json({
        success: true,
        message: 'New backup codes generated',
        data: {
          backupCodes: result.backupCodes,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get MFA status
   * GET /api/mfa/status
   */
  async getStatus(req, res, next) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          isEnabled: user.mfaEnabled || false,
          isMfaEnabled: user.mfaEnabled || false,
          mfaEnabled: user.mfaEnabled || false,
          mfaRequired: mfaService.isMFARequiredForRole(user.role),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MFAController();