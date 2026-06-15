import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-stone-50 px-4">
      <div className="card p-10 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" stroke="#ef4444" strokeWidth="1.5"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="font-display font-semibold text-xl text-stone-900 mb-1">Access denied</h1>
        <p className="text-sm text-stone-500 mb-6">
          You don't have the required role to access this page.
        </p>
        <Link to="/dashboard" className="btn-primary w-full">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
