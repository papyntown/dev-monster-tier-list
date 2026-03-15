export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t border-[var(--line)] px-4 pb-14 pt-10 text-[var(--sea-ink-soft)]">
      <div className="page-wrap flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm">
          &copy; {year} Monster Dev Tier List. Classement non scientifique mais
          tres engage.
        </p>
        <p className="island-kicker m-0">Built with TanStack Start + Neon</p>
      </div>
      <div className="mt-4 flex justify-center gap-4">
        <a
          href="/#tiers"
          className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          <span className="sr-only">Retour au board</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32">
            <path fill="currentColor" d="M8 2l5 5H9v7H7V7H3l5-5z" />
          </svg>
        </a>
        <a
          href="https://www.monsterenergy.com/fr-fr/energy-drinks/"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl p-2 text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
        >
          <span className="sr-only">Catalogue officiel Monster</span>
          <svg viewBox="0 0 16 16" aria-hidden="true" width="32" height="32">
            <path
              fill="currentColor"
              d="M8 1.5l1.8 4.8L14.5 8l-3.7 3 1.2 4.8L8 13.3l-4 2.5L5.2 11 1.5 8l4.7-1.7L8 1.5z"
            />
          </svg>
        </a>
      </div>
    </footer>
  )
}
