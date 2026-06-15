// Authentication routes

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, registerSchema, loginSchema, refreshTokenSchema } = require('../utility/validators');

// Public routes

/**
 * PUBLIC REGISTRATION DISABLED
 * Users can only be created by admin/staff via /api/admin/users
 * This ensures only verified university personnel can create accounts
 */
// router.post('/register', validate(registerSchema), authController.register);

router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);



// Protected routes (require authentication)
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/change-password', authenticate, authController.changePassword);

module.exports = router;