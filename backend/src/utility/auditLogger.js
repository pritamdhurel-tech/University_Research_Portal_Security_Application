// Automatic audit logging with decorator pattern

const { prisma } = require('../../config/database');

/**
 * Wrap an async operation with automatic audit logging
 * @param {string} action - Action name (e.g., "LOGIN", "REGISTER")
 * @param {string|null} userId - User ID (null for registration)
 * @param {Function} operation - Async function to execute
 * @param {Object} context - { ipAddress, userAgent, metadata }
 * @returns {Promise} - Result of operation
 */
async function withAudit(action, userId, operation, context = {}) {
  const startTime = Date.now();
  let result = 'SUCCESS';
  let error = null;
  let returnValue;

  try {
    // Execute the actual operation
    returnValue = await operation();
    return returnValue;
  } catch (err) {
    result = 'FAILURE';
    error = err.message;
    throw err; // Re-throw to maintain error flow
  } finally {
    // ALWAYS log, whether success or failure
    try {
      await prisma.auditLog.create({
        data: {
          userId: userId || undefined,
          action,
          result,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          metadata: {
            duration: Date.now() - startTime,
            error: error,
            ...context.metadata,
          },
        },
      });
    } catch (logError) {
      // Don't let logging errors break the application
      console.error('Failed to create audit log:', logError);
    }
  }
}

/**
 * Create audit log directly (for non-wrapped operations)
 */
async function logAudit(data) {
  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

module.exports = {
  withAudit,
  logAudit,
};