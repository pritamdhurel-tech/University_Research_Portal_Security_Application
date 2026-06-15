// JWT authentication middleware

const { verifyAccessToken } = require('../utility/token');
const { prisma } = require('../../config/database');

/**
 * Authenticate JWT token
 * Attaches user to req.user if valid
 */
async function authenticate(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    const payload = verifyAccessToken(token);

    // Get fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        clearanceLevel: true,
        isActive: true,
        isVerified: true,
        isLocked: true,
        lastLoginLocation: true,
        mfaEnabled: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        message: 'Account is locked',
      });
    }

    // Attach user to request (including mapped isMfaEnabled for frontend)
    req.user = {
      ...user,
      isMfaEnabled: user.mfaEnabled || false
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Optional authentication
 * Attaches user if token is valid, but doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        clearanceLevel: true,
        isActive: true,
        isVerified: true,
        isLocked: true,
        mfaEnabled: true,
      },
    });

    if (user && user.isActive && !user.isLocked) {
      req.user = {
        ...user,
        isMfaEnabled: user.mfaEnabled || false
      };
    }

    next();
  } catch (error) {
    // Invalid token, but continue without user
    next();
  }
}

module.exports = {
  authenticate,
  optionalAuth,
};