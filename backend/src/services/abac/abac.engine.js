const { prisma } = require('../../../config/database');

/**
 * ABAC Engine
 * Evaluates access requests based on subject, resource, action, and environment
 */
class ABACEngine {
  constructor() {
    this.policies = [];
  }

  /**
   * Register a policy
   * @param {Policy} policy - Policy object
   */
  addPolicy(policy) {
    this.policies.push(policy);
    // Sort by priority (higher priority evaluated first)
    this.policies.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  /**
   * Evaluate access request
   * @param {Object} request - { subject, resource, action, environment }
   * @returns {Promise<Object>} - { allowed: boolean, reason: string, policy: string }
   */
  async evaluate(request) {
    const { subject, resource, action, environment } = request;

    // Track which policies were evaluated (for debugging)
    const evaluatedPolicies = [];

    // Evaluate each policy in priority order
    for (const policy of this.policies) {
      try {
        const result = await policy.evaluate(subject, resource, action, environment);
        
        evaluatedPolicies.push({
          name: policy.name,
          effect: result.effect,
          priority: policy.priority,
        });

        // DENY policies take precedence - stop immediately
        if (result.effect === 'DENY') {
          await this.logAccess(request, false, result.reason, policy.name);
          
          return {
            allowed: false,
            reason: result.reason || 'Access denied by policy',
            policy: policy.name,
            evaluatedPolicies,
          };
        }

        // ALLOW policy found
        if (result.effect === 'ALLOW') {
          await this.logAccess(request, true, result.reason, policy.name);
          
          return {
            allowed: true,
            reason: result.reason || 'Access granted',
            policy: policy.name,
            evaluatedPolicies,
          };
        }

        // NOT_APPLICABLE - continue to next policy
      } catch (error) {
        console.error(`Error evaluating policy ${policy.name}:`, error);
        // Continue to next policy on error
      }
    }

    // No policy matched - default DENY
    await this.logAccess(request, false, 'No policy grants access', 'default-deny');

    return {
      allowed: false,
      reason: 'No policy grants access',
      policy: 'default-deny',
      evaluatedPolicies,
    };
  }

  /**
   * Log access attempt (Compliance: audit trail for CONFIDENTIAL+ resources)
   */
  async logAccess(request, allowed, reason, policyMatched) {
    const { subject, resource, action, environment } = request;

    // Only log if resource is CONFIDENTIAL or higher
    let shouldLog = resource?.sensitivityLevel && 
                     ['CONFIDENTIAL', 'RESTRICTED'].includes(resource.sensitivityLevel);

    if (!shouldLog && !allowed) {
      // Always log denials regardless of sensitivity
      shouldLog = true;
    }

    if (!shouldLog) {
      return; // Skip logging for PUBLIC/INTERNAL successful access
    }

    try {
      await prisma.accessLog.create({
        data: {
          // Subject (user)
          userId: subject?.id,
          userRole: subject?.role,
          userDepartment: subject?.department,
          userClearance: subject?.clearanceLevel,

          // Resource
          resourceId: resource?.id,
          resourceType: resource?.type,
          resourceSensitivity: resource?.sensitivityLevel,

          // Action & Decision
          action: action,
          decision: allowed ? 'ALLOW' : 'DENY',
          denyReason: allowed ? null : reason,
          policyMatched: policyMatched,

          // Environment
          ipAddress: environment?.ipAddress,
          accessLocation: environment?.accessLocation,
          userAgent: environment?.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to create access log:', error);
    }
  }
}

/**
 * Policy Class
 * Represents a single ABAC policy with conditions and effect
 */
class Policy {
  constructor(name, conditions, effect, priority = 50) {
    this.name = name;
    this.conditions = conditions; // Async function that returns { match: boolean, reason: string }
    this.effect = effect; // 'ALLOW' or 'DENY'
    this.priority = priority; // Higher = evaluated first
  }

  /**
   * Evaluate if this policy applies
   * @returns {Promise<Object>} - { effect: 'ALLOW' | 'DENY' | 'NOT_APPLICABLE', reason: string }
   */
  async evaluate(subject, resource, action, environment) {
    try {
      const result = await this.conditions(subject, resource, action, environment);

      if (result.match) {
        return {
          effect: this.effect,
          reason: result.reason,
        };
      }

      return { effect: 'NOT_APPLICABLE' };
    } catch (error) {
      console.error(`Error in policy ${this.name}:`, error);
      return { effect: 'NOT_APPLICABLE' };
    }
  }
}

// Create singleton instance
const abacEngine = new ABACEngine();

module.exports = { abacEngine, ABACEngine, Policy };