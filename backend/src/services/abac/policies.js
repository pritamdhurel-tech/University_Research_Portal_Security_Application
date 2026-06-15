// All ABAC policies for University Research Portal

const { Policy } = require('./abac.engine');

/**
 * POLICY 1: Admin Override
 * Priority: 250 (Highest)
 * Effect: ALLOW
 * Rule: Admins have full access to everything
 */
const adminOverridePolicy = new Policy(
  'admin-override',
  async (subject, resource, action, environment) => {
    if (subject.role === 'ADMIN') {
      return {
        match: true,
        reason: 'Administrator has unrestricted access',
      };
    }
    return { match: false };
  },
  'ALLOW',
  250
);

/**
 * POLICY 2: Account Status Check
 * Priority: 200
 * Effect: DENY
 * Rule: User must be active, verified, and not locked
 */
const accountStatusPolicy = new Policy(
  'account-status-check',
  async (subject, resource, action, environment) => {
    if (!subject.isActive) {
      return {
        match: true,
        reason: 'Account is not active',
      };
    }

    if (!subject.isVerified) {
      return {
        match: true,
        reason: 'Email not verified',
      };
    }

    if (subject.isLocked) {
      return {
        match: true,
        reason: 'Account is locked due to failed login attempts',
      };
    }

    return { match: false };
  },
  'DENY',
  200
);

/**
 * POLICY 3: Off-Campus Restriction
 * Priority: 180
 * Effect: DENY
 * Rule: RESTRICTED resources cannot be accessed off-campus (only ON_CAMPUS or VPN)
 */
const offCampusRestrictionPolicy = new Policy(
  'off-campus-restriction',
  async (subject, resource, action, environment) => {
    // Only apply to resources that require on-campus access
    if (!resource?.requiresOnCampusAccess) {
      return { match: false };
    }

    // Check if user is off-campus
    if (environment?.accessLocation === 'OFF_CAMPUS') {
      return {
        match: true,
        reason: 'This resource can only be accessed from on-campus or via VPN',
      };
    }

    return { match: false };
  },
  'DENY',
  180
);

/**
 * POLICY 4: Medical Dataset Access (Critical!)
 * Priority: 175
 * Effect: ALLOW
 * Rule: Medical datasets require Medicine department + CONFIDENTIAL clearance + on-campus/VPN
 */
const medicalDatasetPolicy = new Policy(
  'medical-dataset-access',
  async (subject, resource, action, environment) => {
    // Only applies to medical datasets
    if (resource?.type !== 'DATASET' || resource?.department !== 'MEDICINE') {
      return { match: false };
    }

    // Only applies to CONFIDENTIAL or RESTRICTED medical data
    if (!['CONFIDENTIAL', 'RESTRICTED'].includes(resource.sensitivityLevel)) {
      return { match: false };
    }

    // Check subject requirements
    const hasRole = ['PROFESSOR', 'RESEARCHER'].includes(subject.role);
    const hasDepartment = subject.department === 'MEDICINE';
    const hasClearance = ['CONFIDENTIAL', 'RESTRICTED'].includes(subject.clearanceLevel);
    const hasLocation = ['ON_CAMPUS', 'VPN'].includes(environment?.accessLocation);

    if (hasRole && hasDepartment && hasClearance && hasLocation) {
      return {
        match: true,
        reason: 'User authorized for medical dataset access',
      };
    }

    // If all requirements not met, don't match (let other policies handle it)
    return { match: false };
  },
  'ALLOW',
  175
);

/**
 * POLICY 5: Clearance Level Enforcement
 * Priority: 150
 * Effect: DENY
 * Rule: User clearance must be >= resource sensitivity
 */
const clearanceLevelPolicy = new Policy(
  'clearance-level-check',
  async (subject, resource, action, environment) => {
    if (!resource?.sensitivityLevel) {
      return { match: false }; // No sensitivity level = no restriction
    }

    const clearanceLevels = {
      PUBLIC: 0,
      INTERNAL: 1,
      CONFIDENTIAL: 2,
      RESTRICTED: 3,
    };

    const userClearance = clearanceLevels[subject.clearanceLevel] || 0;
    const resourceSensitivity = clearanceLevels[resource.sensitivityLevel] || 0;

    if (userClearance < resourceSensitivity) {
      return {
        match: true,
        reason: `Insufficient clearance level. Required: ${resource.sensitivityLevel}, User has: ${subject.clearanceLevel}`,
      };
    }

    return { match: false };
  },
  'DENY',
  150
);

/**
 * POLICY 6: Resource Owner Access
 * Priority: 100
 * Effect: ALLOW
 * Rule: Resource owners have full control over their resources
 */
const ownerAccessPolicy = new Policy(
  'owner-full-access',
  async (subject, resource, action, environment) => {
    if (resource?.ownerId && resource.ownerId === subject.id) {
      return {
        match: true,
        reason: 'Resource owner has full access',
      };
    }
    return { match: false };
  },
  'ALLOW',
  100
);

/**
 * POLICY 7: Department Access
 * Priority: 70
 * Effect: ALLOW
 * Rule: Users can access resources from their department (if clearance sufficient)
 */
const departmentAccessPolicy = new Policy(
  'department-access',
  async (subject, resource, action, environment) => {
    // Only applies if resource has a department
    if (!resource?.department) {
      return { match: false };
    }

    // Check if user is in same department
    if (resource.department === subject.department) {
      // Still need to respect clearance levels (checked by clearanceLevelPolicy)
      // This policy just allows same-department access
      return {
        match: true,
        reason: 'User can access resources from their department',
      };
    }

    return { match: false };
  },
  'ALLOW',
  70
);

/**
 * POLICY 8: Role-Based Basic Access
 * Priority: 50
 * Effect: ALLOW
 * Rule: Basic permissions based on role
 */
const roleBasedAccessPolicy = new Policy(
  'role-based-access',
  async (subject, resource, action, environment) => {
    const rolePermissions = {
      ADMIN: ['VIEW', 'READ', 'DOWNLOAD', 'EDIT', 'DELETE'],
      STAFF: ['VIEW', 'READ', 'DOWNLOAD', 'EDIT'],
      PROFESSOR: ['VIEW', 'READ', 'DOWNLOAD', 'EDIT'],
      RESEARCHER: ['VIEW', 'READ', 'DOWNLOAD'],
      STUDENT: ['VIEW', 'READ'],
    };

    const allowedActions = rolePermissions[subject.role] || [];

    if (allowedActions.includes(action)) {
      return {
        match: true,
        reason: `Role ${subject.role} can perform ${action}`,
      };
    }

    return { match: false };
  },
  'ALLOW',
  50
);

// Export all policies
module.exports = {
  adminOverridePolicy,
  accountStatusPolicy,
  offCampusRestrictionPolicy,
  medicalDatasetPolicy,
  clearanceLevelPolicy,
  ownerAccessPolicy,
  departmentAccessPolicy,
  roleBasedAccessPolicy,
};