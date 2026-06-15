import { useAuthStore } from '../store/authStore';
import { RoleBadge, ClearanceBadge, DepartmentBadge } from '../components/ui/Badges';
import { Link } from 'react-router-dom';

// ─── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className={`card p-5 ${accent ? 'bg-brand-500 border-brand-500' : ''}`}>
      <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${accent ? 'text-brand-100' : 'text-stone-400'}`}>
        {label}
      </p>
      <p className={`text-2xl font-semibold ${accent ? 'text-white' : 'text-stone-900'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-0.5 ${accent ? 'text-brand-200' : 'text-stone-400'}`}>{sub}</p>
      )}
    </div>
  );
}

// ─── Quick Action Card ─────────────────────────────────────────────────────────

function QuickAction({
  to,
  icon,
  title,
  desc,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="card p-5 flex items-start gap-4 hover:shadow-card-hover transition-shadow duration-200 group"
    >
      <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
        {icon}
      </div>
      <div>
        <p className="font-medium text-stone-900 text-sm">{title}</p>
        <p className="text-xs text-stone-400 mt-0.5">{desc}</p>
      </div>
      <svg
        width="16"
        height="16"
        fill="none"
        viewBox="0 0 24 24"
        className="ml-auto text-stone-300 group-hover:text-brand-400 shrink-0 mt-0.5 transition-colors"
      >
        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </Link>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isAdmin, isStaff } = useAuthStore();

  if (!user) return null;

  const deptDisplay: Record<string, string> = {
    COMPUTER_SCIENCE: 'Computer Science',
    MEDICINE: 'Medicine',
    ENGINEERING: 'Engineering',
    PHYSICS: 'Physics',
    MATHEMATICS: 'Mathematics',
    LAW: 'Law',
    ARTS: 'Arts',
    GENERAL: 'General',
  };

  return (
    <div className="space-y-8">
      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">
            Good morning, {user.firstName} 👋
          </h1>
          <p className="page-sub">
            Welcome to the University Research Portal
          </p>
        </div>
        {!user.isMfaEnabled && (
          <Link
            to="/mfa-setup"
            className="btn-secondary btn-sm shrink-0 border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Enable 2FA
          </Link>
        )}
      </div>

      {/* ── MFA warning banner ── */}
      {!user.isMfaEnabled && (
        <div className="alert-warning">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p className="font-medium">Two-factor authentication is not enabled</p>
            <p className="text-xs mt-0.5 text-amber-600">
              {isAdmin()
                ? 'MFA is mandatory for admin accounts. Please set it up immediately.'
                : 'We strongly recommend enabling 2FA to protect your account.'}
              {' '}
              <Link to="/mfa-setup" className="underline font-medium">Set up now →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Identity card ── */}
      <div className="card p-5">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Your access profile</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-lg font-semibold text-brand-700">
              {user.firstName[0]}{user.lastName[0]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-stone-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-stone-400">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
          <RoleBadge role={user.role} />
          <DepartmentBadge dept={user.department} />
          <ClearanceBadge level={user.clearanceLevel} />
          {user.isMfaEnabled
            ? <span className="badge-green">MFA enabled</span>
            : <span className="badge-amber">MFA disabled</span>
          }
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Your department"
          value={deptDisplay[user.department] ?? user.department}
          accent
        />
        <StatCard
          label="Clearance level"
          value={user.clearanceLevel}
          sub="Access tier"
        />
        <StatCard
          label="Account status"
          value={user.isActive ? 'Active' : 'Inactive'}
          sub={user.isVerified ? 'Verified' : 'Not verified'}
        />
        <StatCard
          label="Role"
          value={user.role.charAt(0) + user.role.slice(1).toLowerCase()}
          sub="System role"
        />
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-stone-700 mb-3 uppercase tracking-wider">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            to="/resources"
            icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M4 6h16M4 10h16M4 14h8M4 18h6" stroke="#e8651a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            title="Browse resources"
            desc="Access research papers, datasets and reports"
          />
          <QuickAction
            to="/mfa-setup"
            icon={
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#e8651a" strokeWidth="1.5"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#e8651a" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            }
            title="Security settings"
            desc="Manage 2FA and backup codes"
          />
          {isStaff() && (
            <QuickAction
              to="/admin"
              icon={
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="#e8651a" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
              title="User management"
              desc="Create accounts and approve registrations"
            />
          )}
          {isAdmin() && (
            <QuickAction
              to="/audit-logs"
              icon={
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <path d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="#e8651a" strokeWidth="1.5"/>
                </svg>
              }
              title="Audit logs"
              desc="Review access logs and security events"
            />
          )}
        </div>
      </div>

      {/* ── ABAC policy summary (informational) ── */}
      <div className="card p-5">
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
          Your access policy
        </p>
        <div className="space-y-2 text-sm text-stone-600">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5 text-brand-400">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>
              You can access all <strong>PUBLIC</strong> resources across departments.
            </span>
          </div>
          {user.clearanceLevel !== 'PUBLIC' && (
            <div className="flex items-start gap-2">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5 text-brand-400">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 0 0 1.946-.806 3.42 3.42 0 0 1 4.438 0 3.42 3.42 0 0 0 1.946.806 3.42 3.42 0 0 1 3.138 3.138 3.42 3.42 0 0 0 .806 1.946 3.42 3.42 0 0 1 0 4.438 3.42 3.42 0 0 0-.806 1.946 3.42 3.42 0 0 1-3.138 3.138 3.42 3.42 0 0 0-1.946.806 3.42 3.42 0 0 1-4.438 0 3.42 3.42 0 0 0-1.946-.806 3.42 3.42 0 0 1-3.138-3.138 3.42 3.42 0 0 0-.806-1.946 3.42 3.42 0 0 1 0-4.438 3.42 3.42 0 0 0 .806-1.946 3.42 3.42 0 0 1 3.138-3.138Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>
                Clearance level <strong>{user.clearanceLevel}</strong> grants access to
                resources up to this sensitivity tier.
              </span>
            </div>
          )}
          {user.department === 'MEDICINE' && user.clearanceLevel === 'CONFIDENTIAL' && (
            <div className="flex items-start gap-2">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="shrink-0 mt-0.5 text-amber-500">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>
                Medical datasets require <strong>on-campus or VPN</strong> access.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
