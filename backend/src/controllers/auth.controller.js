// Authentication HTTP controllers

const authService = require('../services/auth.service');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body, req.context);
      
      res.status(201).json({
        success: true,
        message: result.needsEmailVerification 
          ? 'Registration successful. Please check your email to verify your account.'
          : 'Registration successful.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password, mfaToken } = req.body; // Add mfaToken

      const result = await authService.login(email, password, req.context, mfaToken);

      // Check if MFA required
      if (result.mfaRequired) {
        return res.status(200).json({
          success: false,
          mfaRequired: true,
          message: result.message,
          // Don't send userId to frontend for security
        });
      }

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }
      
      const result = await authService.refreshAccessToken(refreshToken);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      await authService.logout(refreshToken, req.context);
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify email
   * GET /api/auth/verify-email/:token
   */
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      
      await authService.verifyEmail(token);

      // Redirect to frontend login page with success flag for better UX
      const frontendUrl = process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
      // On failure, redirect with error message
      const frontendUrl = process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?verified=false&error=invalid_token`);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async getCurrentUser(req, res, next) {
    try {
      // User is already attached to req by auth middleware
      res.json({
        success: true,
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
      }

      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
        req.context
      );

      res.json({ success: true, message: result.message });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();