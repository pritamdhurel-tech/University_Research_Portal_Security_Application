import clsx from 'clsx';
import type { Role, ClearanceLevel, SensitivityLevel, ResourceType, Department } from '../../types';

// ─── Role Badge ────────────────────────────────────────────────────────────────

const ROLE_STYLES: Record<Role, string> = {
  ADMIN:       'badge-purple',
  STAFF:       'badge-blue',
  PROFESSOR:   'badge-orange',
  RESEARCHER:  'badge-amber',
  STUDENT:     'badge-gray',
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:       'Admin',
  STAFF:       'Staff',
  PROFESSOR:   'Professor',
  RESEARCHER:  'Researcher',
  STUDENT:     'Student',
};

export function RoleBadge({ role }: { role: Role }) {
  return <span className={ROLE_STYLES[role]}>{ROLE_LABELS[role]}</span>;
}

// ─── Clearance Badge ───────────────────────────────────────────────────────────

const CLEARANCE_STYLES: Record<ClearanceLevel, string> = {
  PUBLIC:       'badge-green',
  INTERNAL:     'badge-blue',
  CONFIDENTIAL: 'badge-amber',
  RESTRICTED:   'badge-red',
};

export function ClearanceBadge({ level }: { level: ClearanceLevel }) {
  return <span className={CLEARANCE_STYLES[level]}>{level}</span>;
}

// ─── Sensitivity Badge ─────────────────────────────────────────────────────────

const SENSITIVITY_STYLES: Record<SensitivityLevel, string> = {
  PUBLIC:       'badge-green',
  INTERNAL:     'badge-blue',
  CONFIDENTIAL: 'badge-amber',
  RESTRICTED:   'badge-red',
};

export function SensitivityBadge({ level }: { level: SensitivityLevel }) {
  return <span className={SENSITIVITY_STYLES[level]}>{level}</span>;
}

// ─── Resource Type Badge ───────────────────────────────────────────────────────

const TYPE_STYLES: Record<ResourceType, string> = {
  PAPER:   'badge-blue',
  DATASET: 'badge-orange',
  THESIS:  'badge-purple',
  REPORT:  'badge-gray',
};

const TYPE_ICONS: Record<ResourceType, string> = {
  PAPER:   '📄',
  DATASET: '🗄️',
  THESIS:  '📘',
  REPORT:  '📊',
};

export function ResourceTypeBadge({ type }: { type: ResourceType }) {
  return (
    <span className={TYPE_STYLES[type]}>
      <span className="text-xs">{TYPE_ICONS[type]}</span>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Department Badge ──────────────────────────────────────────────────────────

const DEPT_SHORT: Record<Department, string> = {
  COMPUTER_SCIENCE: 'CS',
  MEDICINE:         'MED',
  ENGINEERING:      'ENG',
  PHYSICS:          'PHY',
  MATHEMATICS:      'MATH',
  LAW:              'LAW',
  ARTS:             'ARTS',
  GENERAL:          'GEN',
};

export function DepartmentBadge({ dept }: { dept: Department }) {
  return <span className="badge-gray">{DEPT_SHORT[dept] ?? dept}</span>;
}

// ─── Access Decision Badge ─────────────────────────────────────────────────────

export function AccessDecisionBadge({
  decision,
  denyReason,
}: {
  decision: 'ALLOW' | 'DENY';
  denyReason?: string | null;
}) {
  if (decision === 'ALLOW') {
    return (
      <span className="badge-green">
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
          <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Access granted
      </span>
    );
  }

  return (
    <span
      className={clsx('badge-red', denyReason && 'cursor-help')}
      title={denyReason ?? undefined}
    >
      <svg width="10" height="10" fill="none" viewBox="0 0 24 24">
        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      Access denied
    </span>
  );
}

// ─── Network Location Badge ────────────────────────────────────────────────────

export function LocationBadge({ location }: { location: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ON_CAMPUS:  { label: 'On campus',  cls: 'badge-green' },
    VPN:        { label: 'VPN',        cls: 'badge-blue' },
    OFF_CAMPUS: { label: 'Off campus', cls: 'badge-amber' },
  };
  const { label, cls } = map[location] ?? { label: location, cls: 'badge-gray' };
  return <span className={cls}>{label}</span>;
}
