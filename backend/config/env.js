require("dotenv").config();

const config = {
    // server
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3000,

    // Database
    databaseUrl: process.env.DATABASE_URL,

    // JWT
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    },
    
    
    // Security
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 15,
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
    },

      // MFA Config
    mfa: {
        issuer: process.env.MFA_ISSUER || 'University Portal',
        requiredRoles: (process.env.MFA_REQUIRED_ROLES || 'ADMIN,STAFF').split(','),
    },
    // University
    university: {
        name: process.env.UNIVERSITY_NAME,
        domain: process.env.UNIVERSITY_DOMAIN,
        ipRanges: (process.env.UNIVERSITY_IP_RANGES || '').split(','),
    },

    // App
    appUrl: process.env.APP_URL || 'http://localhost:3000',

    // Email
    email: {
      enabled: process.env.EMAIL_ENABLED === 'true',
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      from: process.env.EMAIL_FROM,
    },


    // CORS
    cors: {
        allowOrign: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
    },

    // Audit
    audit: {
        retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS) || 730,
        logConfidentialAccess: process.env.LOG_CONFIDENTIAL_ACCESS === 'true',
  },
};

// Validate required variables
const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const envMap = {
  database: { url: config.databaseUrl },
  jwt: { access: { secret: config.jwt.accessSecret }, refresh: { secret: config.jwt.refreshSecret } }
};

const missing = required.filter(key => {
  const parts = key.toLowerCase().split('_');
  let value = envMap;
  for (const part of parts) {
    value = value?.[part];
  }
  return !value;
});

if (missing.length > 0) {
  console.error(' Missing required environment variables:');
  missing.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

module.exports = config;