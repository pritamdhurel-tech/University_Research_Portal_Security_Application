// Input validation using Zod

const { z } = require('zod');

// Enums from Prisma schema
const RoleSchema = z.enum(['STUDENT', 'PROFESSOR', 'RESEARCHER', 'STAFF', 'ADMIN']);
const DepartmentSchema = z.enum(['COMPUTER_SCIENCE', 'MEDICINE', 'ENGINEERING', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'MATHEMATICS']);
const ClearanceLevelSchema = z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']);

// Registration validation
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: RoleSchema,
  department: DepartmentSchema,
  clearanceLevel: ClearanceLevelSchema.optional(),
});

// Admin create user validation (no password required)
const adminCreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: RoleSchema,
  department: DepartmentSchema,
  clearanceLevel: ClearanceLevelSchema.optional(),
});

// Login validation
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Refresh token validation
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Validation middleware factory
 * @param {z.Schema} schema - Zod schema to validate against
 * @returns {Function} - Express middleware
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error.errors) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };
}


const ResourceTypeSchema = z.enum(['PAPER', 'DATASET', 'THESIS', 'REPORT']);

// Create resource validation
const createResourceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  type: ResourceTypeSchema,
  sensitivityLevel: ClearanceLevelSchema,
  department: DepartmentSchema,
  requiresOnCampusAccess: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
  
  // NEW: Metadata fields
  externalUrl: z.string().url('Invalid URL').optional(),
  doi: z.string().optional(),
  emailContact: z.string().email('Invalid email').optional(),
});

// Update resource validation
const updateResourceSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: ResourceTypeSchema.optional(),
  sensitivityLevel: ClearanceLevelSchema.optional(),
  requiresOnCampusAccess: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
});

// MFA token validation
const mfaTokenSchema = z.object({
  token: z.string()
    .length(8, '2FA code must be 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Invalid 2FA code format'),
});

// MFA disable validation
const mfaDisableSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  token: z.string()
    .length(8, '2FA code must be 8 characters'),
});

module.exports = {
  registerSchema,
  adminCreateUserSchema,
  loginSchema,
  refreshTokenSchema,
  validate,
  RoleSchema,
  DepartmentSchema,
  ClearanceLevelSchema,
  createResourceSchema,
  updateResourceSchema,
  ResourceTypeSchema,
  mfaTokenSchema,
  mfaDisableSchema
};