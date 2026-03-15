import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
      <section className="island-shell relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
        <div className="pointer-events-none absolute right-[-8%] top-[-15%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(163,255,115,0.26),transparent_62%)] blur-3xl" />
        <p className="island-kicker mb-2">About</p>
        <h1 className="display-title mb-4 max-w-4xl text-4xl font-bold text-[var(--sea-ink)] sm:text-5xl">
          Une tier list Monster, pensee comme un mini produit de dev.
        </h1>
        <p className="max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          Le front charge les canettes depuis `data/monster.json`, memorise le
          prenom dans le local storage, et permet un classement responsive en
          drag and drop. Les sauvegardes passent par des server functions
          TanStack Start.
        </p>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--sea-ink-soft)]">
          Tant que `DATABASE_URL` n est pas configure, l application utilise un
          stockage local de secours pour continuer a fonctionner. Une fois Neon
          branche, la meme interface alimentera automatiquement la table
          `monster_tier_lists`.
        </p>
      </section>
    </main>
  )
}
