// Admin user management controllers

const adminService = require('../services/admin.service');

class AdminController {
  /**
   * Create new user (admin/staff only)
   * POST /api/admin/users
   */
  async createUser(req, res, next) {
    try {
      const result = await adminService.createUser(
        req.body,
        req.user.id,
        req.user.role,
        req.context
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve pending user (admin only)
   * POST /api/admin/users/:id/approve
   */
  async approveUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await adminService.approveUser(
        id,
        req.user.id,
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
   * List pending users (admin only)
   * GET /api/admin/users/pending
   */
  async listPendingUsers(req, res, next) {
    try {
      const users = await adminService.listPendingUsers();

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Setup password (public - uses token)
   * POST /api/admin/setup-password
   */
  async setupPassword(req, res, next) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          success: false,
          message: 'Token and password are required',
        });
      }

      const result = await adminService.setupPassword(
        token,
        password,
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
}

module.exports = new AdminController();