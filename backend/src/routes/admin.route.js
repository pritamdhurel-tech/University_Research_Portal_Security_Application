// Admin routes - protected by ABAC

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/abac.middleware');
const { validate, adminCreateUserSchema } = require('../utility/validators');

/**
 * Create new user
 * Accessible by: ADMIN (any user), STAFF (creates pending users)
 */
router.post(
  '/users',
  authenticate,
  authorize({
    action: 'EDIT',
    getResource: async (req) => {
      // Check if user is ADMIN or STAFF
      if (!['ADMIN', 'STAFF'].includes(req.user.role)) {
        throw new Error('Only admin and staff can create users');
      }
      return { type: 'USER_MANAGEMENT' };
    },
  }),
  validate(adminCreateUserSchema),
  adminController.createUser
);

/**
 * Approve pending user
 * Accessible by: ADMIN only
 */
router.post(
  '/users/:id/approve',
  authenticate,
  authorize({
    action: 'EDIT',
    getResource: async (req) => {
      if (req.user.role !== 'ADMIN') {
        throw new Error('Only administrators can approve users');
      }
      return { type: 'USER_APPROVAL' };
    },
  }),
  adminController.approveUser
);

/**
 * List pending users
 * Accessible by: ADMIN only
 */
router.get(
  '/users/pending',
  authenticate,
  authorize({
    action: 'READ',
    getResource: async (req) => {
      if (req.user.role !== 'ADMIN') {
        throw new Error('Only administrators can view pending users');
      }
      return { type: 'USER_LIST' };
    },
  }),
  adminController.listPendingUsers
);

/**
 * Setup password (public endpoint - uses token)
 */
router.post('/setup-password', adminController.setupPassword);

module.exports = router;