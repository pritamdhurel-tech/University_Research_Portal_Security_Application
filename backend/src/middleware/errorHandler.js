// Global error handling middleware

const config = require('../../config/env');

/**
 * Global error handler
 * Catches all errors and returns consistent JSON response
 */
function errorHandler(err, req, res, next) {
  // Log error
  console.error('Error:', err);
  
  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  
  // Prisma errors
  if (err.code === 'P2002') {
    status = 400;
    message = 'A record with this value already exists';
  }
  
  if (err.code === 'P2025') {
    status = 404;
    message = 'Record not found';
  }
  
  // Validation errors
  if (err.name === 'ValidationError') {
    status = 400;
  }
  
  // Send response
  res.status(status).json({
    success: false,
    message: message,
    ...(config.nodeEnv === 'development' && { 
      stack: err.stack,
      error: err 
    }),
  });
}

/**
 * 404 handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};