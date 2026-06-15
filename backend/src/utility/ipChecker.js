// Determine access location: ON_CAMPUS, VPN, or OFF_CAMPUS

const config = require('../../config/env');

/**
 * Check if IP is within a CIDR range
 */
function isIPInRange(ip, cidr) {
  const [range, bits] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0);
  
  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * Determine access location based on IP address and headers
 * @param {string} ip - IP address
 * @param {Object} headers - Request headers (optional)
 * @returns {string} - "ON_CAMPUS", "VPN", "OFF_CAMPUS", or "UNKNOWN"
 */
function determineAccessLocation(ip, headers = {}) {
  if (!ip) return 'UNKNOWN';
  
  // Check VPN authentication header (if VPN gateway sets it)
  if (headers['x-vpn-authenticated'] === 'true') {
    return 'VPN';
  }
  
  // Handle localhost (development)
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('::ffff:127.')) {
    return 'ON_CAMPUS'; // Treat localhost as on-campus for development
  }
  
  // Check VPN IP ranges (if configured)
  const vpnRanges = (process.env.VPN_IP_RANGES || '').split(',').filter(r => r.trim());
  for (const cidr of vpnRanges) {
    try {
      if (isIPInRange(ip, cidr)) {
        return 'VPN';
      }
    } catch (error) {
      console.error(`Invalid VPN CIDR range: ${cidr}`);
    }
  }
  
  // Check on-campus IP ranges
  const campusRanges = config.university.ipRanges.filter(r => r.trim());
  for (const cidr of campusRanges) {
    try {
      if (isIPInRange(ip, cidr)) {
        return 'ON_CAMPUS';
      }
    } catch (error) {
      console.error(`Invalid campus CIDR range: ${cidr}`);
    }
  }
  
  return 'OFF_CAMPUS';
}

module.exports = {
  determineAccessLocation,
  isIPInRange,
};