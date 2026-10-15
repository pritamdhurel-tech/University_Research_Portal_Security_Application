import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Fingerprint,
  LibraryBig,
  Microscope,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const benefits = [
  {
    icon: LibraryBig,
    title: 'One connected library',
    description:
      'Bring research resources together in one place, ready to explore across departments and disciplines.',
  },
  {
    icon: Fingerprint,
    title: 'Access that fits your role',
    description:
      'Role- and attribute-based controls help ensure people can reach the resources relevant to their work.',
  },
  {
    icon: ShieldCheck,
    title: 'Security built in',
    description:
      'Strong authentication and clear access controls help protect the work and people behind every discovery.',
  },
];

function PortalMark({ light = false }: { light?: boolean }) {
  return (
    <span
      className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
        light ? 'bg-white/10' : 'bg-brand-500'
      }`}
      aria-hidden="true"
    >
      <svg width="21" height="21" fill="none" viewBox="0 0 24 24">
        <path
          d="M12 3L3 8.5V15.5L12 21L21 15.5V8.5L12 3Z"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M12 3V21M3 8.5L21 15.5M21 8.5L3 15.5"
          stroke="white"
          strokeWidth="1"
          strokeOpacity="0.45"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const portalPath = isAuthenticated ? '/dashboard' : '/login';

  return (
    <div className="min-h-dvh overflow-hidden bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
          <PortalMark />
          <span>
            <span className="block font-display text-base font-semibold leading-tight sm:text-lg">
              University
            </span>
            <span className="block text-xs text-stone-500">Research Portal</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-7">
          <a
            href="#about"
            className="hidden text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 sm:inline"
          >
            About
          </a>
          <a
            href="#security"
            className="hidden text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 sm:inline"
          >
            Security
          </a>
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="btn-primary btn-sm sm:px-4 sm:py-2.5"
          >
            {isAuthenticated ? 'Open portal' : 'Sign in'}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="page-enter">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3.5 py-2 text-xs font-medium text-brand-700">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              A connected home for university research
            </div>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.12] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
              Research moves forward when{' '}
              <span className="text-brand-600">knowledge connects.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              Explore university research resources in one secure place. Find
              what you need, connect ideas, and make space for the next
              discovery.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={portalPath} className="btn-primary btn-lg group">
                {isAuthenticated ? 'Go to your dashboard' : 'Access the portal'}
                <ArrowRight
                  size={17}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a href="#about" className="btn-secondary btn-lg">
                Discover the portal
              </a>
            </div>
            <div className="mt-10 flex items-center gap-3 border-t border-stone-200 pt-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <p className="text-sm text-stone-500">
                Thoughtful access. Protected research.
              </p>
            </div>
          </div>

          <div
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
            aria-label="Illustration of connected research resources"
            role="img"
          >
            <div className="absolute -inset-4 rounded-[2.5rem] bg-brand-100/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] bg-stone-900 p-6 text-white shadow-2xl sm:p-9">
              <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full border border-white/10" />
              <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-brand-300/20" />
              <div className="absolute -right-2 -top-3 h-32 w-32 rounded-full bg-brand-500/20 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <PortalMark light />
                    <div>
                      <p className="text-sm font-medium">Research, connected</p>
                      <p className="mt-0.5 text-xs text-stone-400">
                        Your university portal
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-stone-300">
                    SECURE ACCESS
                  </span>
                </div>

                <div className="relative my-8 flex h-52 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-stone-800 via-stone-800 to-stone-900 sm:h-64">
                  <div className="absolute h-44 w-44 rounded-full border border-brand-300/25 sm:h-56 sm:w-56" />
                  <div className="absolute h-32 w-32 rounded-full border border-brand-300/35 sm:h-40 sm:w-40" />
                  <div className="absolute h-20 w-20 rounded-full bg-brand-500/15 blur-xl" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-300/30 bg-brand-500/20 text-brand-200 shadow-lg shadow-brand-950/30">
                    <Microscope size={28} strokeWidth={1.5} aria-hidden="true" />
                  </div>
                  <span className="absolute left-[16%] top-[24%] flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-stone-800 text-brand-200">
                    <BookOpen size={18} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className="absolute bottom-[17%] right-[19%] h-3 w-3 rounded-full bg-brand-400 shadow-[0_0_18px_rgba(240,112,48,0.8)]" />
                  <span className="absolute right-[17%] top-[20%] h-2 w-2 rounded-full bg-stone-300" />
                  <span className="absolute bottom-[23%] left-[24%] h-2 w-2 rounded-full bg-brand-300" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-stone-400">Built around</p>
                    <p className="mt-1 text-sm font-medium">Open discovery</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs text-stone-400">Designed for</p>
                    <p className="mt-1 text-sm font-medium">Secure collaboration</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3.5 shadow-card sm:-left-7 sm:p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Fingerprint size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  Access with confidence
                </p>
                <p className="mt-0.5 text-[11px] text-stone-500">
                  Identity-aware protection
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="border-y border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
                A better way to find your way
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                A portal built around the work that matters.
              </h2>
              <p className="mt-4 text-sm leading-6 text-stone-500 sm:text-base">
                Research is collaborative, complex, and worth protecting. The
                portal brings useful resources and responsible access together.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }, index) => (
                <article
                  key={title}
                  id={index === 2 ? 'security' : undefined}
                  className="rounded-3xl border border-stone-200 bg-stone-50 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover sm:p-7"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-semibold text-stone-900">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              Start exploring
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
              Your next research connection starts here.
            </h2>
          </div>
          <Link to={portalPath} className="btn-primary group shrink-0">
            {isAuthenticated ? 'Open your dashboard' : 'Sign in to the portal'}
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span>University Research Portal</span>
          <span>Research access, thoughtfully secured.</span>
        </div>
      </footer>
    </div>
  );
}
