// ABAC authorization middleware

const { abacEngine } = require('../services/abac/abac.engine');
const policies = require('../services/abac/policies');

// Register all policies
Object.values(policies).forEach(policy => {
  abacEngine.addPolicy(policy);
});

/**
 * ABAC Authorization middleware factory
 * @param {Object} options - { action, getResource }
 * @returns {Function} Express middleware
 */
function authorize(options = {}) {
  return async (req, res, next) => {
    try {
      // User must be authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Build subject attributes from authenticated user
      const subject = {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        clearanceLevel: req.user.clearanceLevel,
        isActive: req.user.isActive,
        isVerified: req.user.isVerified,
        isLocked: req.user.isLocked,
      };

      // Build resource attributes
      let resource = null;
      if (options.getResource && typeof options.getResource === 'function') {
        // Custom function to get resource
        resource = await options.getResource(req);
      }

      // Determine action
      const action = options.action || mapHttpMethodToAction(req.method);

      // Build environment attributes
      const environment = {
        ipAddress: req.context?.ipAddress,
        userAgent: req.context?.userAgent,
        accessLocation: req.context?.location || 'UNKNOWN',
        timestamp: new Date(),
      };

      // Evaluate access
      const decision = await abacEngine.evaluate({
        subject,
        resource,
        action,
        environment,
      });

      if (!decision.allowed) {
        return res.status(403).json({
          success: false,
          message: decision.reason,
          policy: decision.policy,
        });
      }

      // Access granted - attach decision to request for reference
      req.abacDecision = decision;
      next();
    } catch (error) {
      console.error('ABAC authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
}

/**
 * Map HTTP method to ABAC action
 */
function mapHttpMethodToAction(method) {
  const mapping = {
    GET: 'READ',
    POST: 'EDIT',
    PUT: 'EDIT',
    PATCH: 'EDIT',
    DELETE: 'DELETE',
  };
  return mapping[method] || 'READ';
}

/**
 * Quick authorization helpers
 */
const abac = {
  // Admin only
  adminOnly: authorize({
    action: 'EDIT',
  }),

  // Authenticated users (basic check)
  authenticated: authorize({
    action: 'READ',
  }),
};

module.exports = {
  authorize,
  abac,
};