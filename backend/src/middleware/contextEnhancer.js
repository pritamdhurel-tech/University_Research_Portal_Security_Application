// Automatically capture request context (IP, user agent, location)

const { determineAccessLocation } = require('../utility/ipChecker');

/**
 * Enrich request with context information
 * Attaches req.context with IP, user agent, location, etc.
 */
function enrichContext(req, res, next) {
  // Get real IP (considering proxy/load balancer)
  const ip = req.ip || 
             req.headers['x-forwarded-for']?.split(',')[0] || 
             req.connection.remoteAddress;
  
  // Get user agent
  const userAgent = req.headers['user-agent'];
  
  // Determine access location (ON_CAMPUS, VPN, OFF_CAMPUS)
  const location = determineAccessLocation(ip, req.headers);
  
  // Attach context to request
  req.context = {
    ipAddress: ip,
    userAgent: userAgent,
    location: location,
    timestamp: new Date(),
  };
  
  next();
}

module.exports = enrichContext;