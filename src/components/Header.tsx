import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Monster Dev Tier List
          </Link>
        </h2>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <a
            href="https://www.monsterenergy.com/fr-fr/energy-drinks/"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] sm:block"
          >
            <span className="sr-only">Voir le catalogue Monster</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" width="24" height="24">
              <path
                fill="currentColor"
                d="M12 2l2.2 5.9L20 10l-4.3 3.5 1.4 6L12 16.2 6.9 19.5l1.4-6L4 10l5.8-2.1L12 2z"
              />
            </svg>
          </a>
          <a
            href="/#communaute"
            className="hidden rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)] sm:block"
          >
            <span className="sr-only">Aller a la communaute</span>
            <svg viewBox="0 0 16 16" aria-hidden="true" width="24" height="24">
              <path
                fill="currentColor"
                d="M2 8.5h12v2H2zm8-4h4v2h-4zm-4 8h8v2H6z"
              />
            </svg>
          </a>

          <ThemeToggle />
        </div>

        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Tier list
          </Link>
          <a href="/#communaute" className="nav-link">
            Communaute
          </a>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            A propos
          </Link>
          <a
            href="https://neon.com/"
            className="nav-link"
            target="_blank"
            rel="noreferrer"
          >
            Neon
          </a>
        </div>
      </nav>
    </header>
  )
}
