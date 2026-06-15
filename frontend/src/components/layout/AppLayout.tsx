import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import clsx from 'clsx';

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh bg-stone-50 overflow-hidden">
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile drawer overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
        </div>
      )}

      {/* ── Mobile drawer panel ── */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 md:hidden transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar onClose={() => setMobileOpen(false)} />
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-stone-200 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="btn-ghost btn-sm -ml-1 p-2"
            aria-label="Open menu"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24">
                <path d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-stone-900 text-sm">Research Portal</span>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 text-left">
          <div className="max-w-7xl page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
