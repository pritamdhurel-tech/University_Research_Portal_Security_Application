// Main routes aggregator

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.route');
const mfaRoutes = require('./mfa.route');
const resourceRoutes = require('./resource.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/mfa', mfaRoutes);
router.use('/resources', resourceRoutes);

// Add admin routes
const adminRoutes = require('./admin.route');

router.use('/admin', adminRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;