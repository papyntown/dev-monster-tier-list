import {
  MONSTER_BY_ID,
  TIER_DEFINITIONS,
  type SavedTierList,
} from '#/lib/monster-data'

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function CommunityTierCard({
  tierList,
}: {
  tierList: SavedTierList
}) {
  return (
    <article className="community-card rounded-[2rem] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(10,14,13,0.92),rgba(12,16,15,0.74))] p-5 shadow-[0_16px_28px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#9ddf7a]">
            Dev du multivers
          </p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-white">
            {tierList.firstName}
          </h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
          Maj {formatUpdatedAt(tierList.updatedAt)}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {TIER_DEFINITIONS.map((tier) => {
          const monsterIds = tierList.assignments[tier.id]

          return (
            <section
              key={tier.id}
              className="rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b7ff8a]">
                    {tier.label}
                  </span>
                  <span className="text-xs text-white/45">{tier.emoji}</span>
                </div>
                <span className="text-xs font-medium text-white/55">
                  {monsterIds.length} canette{monsterIds.length > 1 ? 's' : ''}
                </span>
              </div>

              {monsterIds.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {monsterIds.slice(0, 6).map((monsterId) => (
                    <img
                      key={monsterId}
                      src={MONSTER_BY_ID[monsterId].localImagePath}
                      alt={MONSTER_BY_ID[monsterId].name}
                      className="h-16 w-auto rounded-xl border border-white/8 bg-black/20 p-1.5 object-contain"
                      loading="lazy"
                    />
                  ))}
                  {monsterIds.length > 6 ? (
                    <div className="grid h-16 w-16 place-items-center rounded-xl border border-dashed border-white/12 bg-white/[0.03] text-xs font-semibold text-white/55">
                      +{monsterIds.length - 6}
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="mt-2 text-sm text-white/40">
                  Vide pour le moment.
                </p>
              )}
            </section>
          )
        })}
      </div>
    </article>
  )
}
