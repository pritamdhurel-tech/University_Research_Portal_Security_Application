import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { RoleBadge } from '../ui/Badges';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
}

const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24">
    <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    to: '/dashboard',
    label: 'Overview',
    icon: <Icon d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />,
  },
  {
    to: '/resources',
    label: 'Resources',
    icon: <Icon d="M4 6h16M4 10h16M4 14h8M4 18h6" />,
  },
  {
    to: '/security',
    label: 'Security',
    icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  },
  {
    to: '/admin',
    label: 'Admin',
    icon: <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
    roles: ['ADMIN', 'STAFF'],
  },
  {
    to: '/audit-logs',
    label: 'Audit logs',
    icon: <Icon d="M9 12h6M9 16h6M9 8h6M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />,
    roles: ['ADMIN'],
  },
];

interface Props {
  onClose?: () => void; // for mobile drawer
}

export default function Sidebar({ onClose }: Props) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="flex flex-col h-full bg-white border-r border-stone-200 w-64">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shrink-0">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-stone-900 text-sm leading-tight">University</p>
            <p className="text-xs text-stone-400 truncate">Research Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-4 mb-2 text-xs font-medium text-stone-400 uppercase tracking-wider">
          Navigation
        </p>
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              clsx('nav-link', isActive && 'nav-link-active')
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User profile footer */}
      <div className="px-3 py-4 border-t border-stone-100 space-y-1">
        {user && (
          <div className="px-4 py-3 rounded-2xl bg-stone-50 mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Avatar initials */}
              <div className="w-7 h-7 rounded-xl bg-brand-100 flex items-center justify-center">
                <span className="text-xs font-semibold text-brand-700">
                  {user.firstName[0]}{user.lastName[0]}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-stone-400 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <RoleBadge role={user.role} />
              {user.isMfaEnabled ? (
                <span className="badge-green text-xs">MFA on</span>
              ) : (
                <span className="badge-amber text-xs">MFA off</span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
