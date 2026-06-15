// ─── User & Auth ──────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'STAFF' | 'PROFESSOR' | 'RESEARCHER' | 'STUDENT';
export type Department = 'COMPUTER_SCIENCE' | 'MEDICINE' | 'ENGINEERING' | 'PHYSICS' | 'CHEMISTRY' | 'BIOLOGY' | 'MATHEMATICS';
export type ClearanceLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
export type AccountStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'LOCKED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department: Department;
  clearanceLevel: ClearanceLevel;
  isActive: boolean;
  isVerified: boolean;
  isLocked: boolean;
  isMfaEnabled: boolean;
  termsAcceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaToken?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  requiresMfa?: boolean;
  mfaSessionToken?: string;
}

// ─── Resources ────────────────────────────────────────────────────────────────

export type ResourceType = 'PAPER' | 'DATASET' | 'THESIS' | 'REPORT';
export type SensitivityLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  sensitivity: SensitivityLevel;
  department: Department;
  externalUrl: string | null;
  emailContact: string | null;
  requiresOnCampusAccess: boolean;
  tags: string[];
  ownerId: string;
  owner?: { firstName: string; lastName: string; email: string };
  projectTag?: string;
  createdAt: string;
  updatedAt: string;
  // ABAC decision (may be enriched client-side)
  accessDecision?: 'ALLOW' | 'DENY';
  denyReason?: string;
}

export interface ResourceFilters {
  type?: ResourceType;
  sensitivity?: SensitivityLevel;
  department?: Department;
  search?: string;
}

// ─── Access Control ────────────────────────────────────────────────────────────

export type AccessDecision = 'ALLOW' | 'DENY' | 'NOT_APPLICABLE';
export type NetworkLocation = 'ON_CAMPUS' | 'VPN' | 'OFF_CAMPUS';

export interface AccessCheckResult {
  decision: AccessDecision;
  policyMatched: string | null;
  denyReason: string | null;
  userLocation: NetworkLocation;
}

// ─── Admin ─────────────────────────────────────────────────────────────────────

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department: Department;
  clearanceLevel: ClearanceLevel;
}

export interface PendingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  department: Department;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string };
}

// ─── MFA ───────────────────────────────────────────────────────────────────────

export interface MfaSetupResponse {
  qrCodeDataUrl: string;
  secret: string;
  backupCodes?: string[];
}

export interface MfaStatus {
  isEnabled: boolean;
  backupCodesRemaining: number;
}

// ─── Audit ─────────────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  userId: string;
  user?: { firstName: string; lastName: string; email: string };
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AccessLogEntry {
  id: string;
  userId: string;
  resourceId: string;
  resource?: { title: string; type: ResourceType };
  action: string;
  decision: AccessDecision;
  denyReason: string | null;
  policyMatched: string | null;
  userRole: Role;
  userDepartment: Department;
  userClearance: ClearanceLevel;
  userLocation: NetworkLocation;
  createdAt: string;
}

// ─── API Envelope ──────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
