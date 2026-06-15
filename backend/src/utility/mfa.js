// Two-Factor Authentication utilities

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const config = require('../../config/env');

/**
 * Generate 2FA secret for user
 * @param {string} email - User email
 * @returns {Object} - { secret, otpauthUrl }
 */
function generateMFASecret(email) {
  const secret = speakeasy.generateSecret({
    name: `${config.university.name} (${email})`,
    issuer: config.university.name,
    length: 32,
  });

  return {
    secret: secret.base32, // Store this in database
    otpauthUrl: secret.otpauth_url, // Used to generate QR code
  };
}

/**
 * Generate QR code data URL from otpauth URL
 * @param {string} otpauthUrl - OTP auth URL from secret
 * @returns {Promise<string>} - Data URL for QR code image
 */
async function generateQRCode(otpauthUrl) {
  try {
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify TOTP token
 * @param {string} token - 6-digit code from authenticator app
 * @param {string} secret - User's MFA secret
 * @returns {boolean} - True if valid
 */
function verifyMFAToken(token, secret) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps (30 seconds each) for clock drift
  });
}

/**
 * Generate backup codes
 * @param {number} count - Number of codes to generate (default: 8)
 * @returns {Array<string>} - Array of backup codes
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Generate random 8-character code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup code for storage
 * @param {string} code - Backup code
 * @returns {string} - Hashed code
 */
function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verify backup code
 * @param {string} code - Code provided by user
 * @param {Array<string>} hashedCodes - Array of hashed backup codes
 * @returns {Object} - { valid: boolean, remainingCodes: Array }
 */
function verifyBackupCode(code, hashedCodes) {
  const hashedInput = hashBackupCode(code);
  const index = hashedCodes.indexOf(hashedInput);

  if (index === -1) {
    return { valid: false, remainingCodes: hashedCodes };
  }

  // Remove used code
  const remainingCodes = hashedCodes.filter((_, i) => i !== index);

  return {
    valid: true,
    remainingCodes: remainingCodes,
  };
}

module.exports = {
  generateMFASecret,
  generateQRCode,
  verifyMFAToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
};