import { NavLink } from 'react-router-dom';
import { cn } from '@/utils';

export function Toolbar() {
  return (
    <header className="border-surface-700 bg-surface-900 flex min-h-18 shrink-0 items-center justify-between gap-3 border-b px-4 sm:px-6">
      <div className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="border-accent-400/20 bg-accent-400/10 text-accent-400 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-[0_0_24px_rgba(34,211,238,0.08)]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3v4a5 5 0 0 0 10 0V3" />
              <path d="M4 3h4" />
              <path d="M14 3h4" />
              <path d="M11 12v2.5a4.5 4.5 0 0 0 9 0V12" />
              <circle cx="20" cy="10.5" r="1.5" />
            </svg>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-50">
              Video diagnostic
            </h1>
            <p className="mt-0.5 truncate text-xs text-slate-400">
              Video diagnostic sync with Iba signal.
            </p>
          </div>
        </div>

        <div className="bg-surface-700 hidden h-8 w-px sm:block" />

        <nav
          className="flex shrink-0 items-center gap-1"
          aria-label="Main navigation"
        >
          {[
            { label: 'Home', to: '/' },
            { label: 'Overview', to: '/overview' },
            { label: 'Manual', to: '/manual' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3 py-2 text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-accent-400/10 text-accent-400'
                    : 'hover:bg-surface-800 text-slate-400 hover:text-slate-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <a
          href="https://buymeacoffee.com/vanluyen89"
          target="_blank"
          rel="noreferrer"
          aria-label="Support the project on Buy Me a Coffee"
          className="inline-flex items-center gap-2 rounded-lg bg-[#ffdd00] px-3 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-[#ffe433] focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:outline-none"
        >
          <span aria-hidden="true">☕</span>
          <span className="hidden md:inline">Buy me a coffee</span>
        </a>
        <a
          href="https://github.com/vanluyen89/DiagnosticVideoSyncIba"
          target="_blank"
          rel="noreferrer"
          aria-label="View source code on GitHub"
          className="border-surface-600 bg-surface-850 hover:border-accent-400/40 hover:bg-accent-400/5 hover:text-accent-400 focus-visible:ring-accent-400 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold text-slate-300 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4.5 w-4.5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.19-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.41-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.18c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
          </svg>
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </header>
  );
}
