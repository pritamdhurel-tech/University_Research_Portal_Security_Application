// src/routes/mfa.routes.js
// MFA routes

const express = require('express');
const router = express.Router();
const mfaController = require('../controllers/mfa.controller');
const { authenticate } = require('../middleware/auth.middleware');

// All MFA routes require authentication
router.use(authenticate);

// Setup MFA
router.post('/setup', mfaController.setupMFA);

// Verify MFA setup
router.post('/verify-setup', mfaController.verifySetup);

// Disable MFA
router.post('/disable', mfaController.disableMFA);

// Regenerate backup codes
router.post('/regenerate-codes', mfaController.regenerateBackupCodes);

// Get MFA status
router.get('/status', mfaController.getStatus);

module.exports = router;