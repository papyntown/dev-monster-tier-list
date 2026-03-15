import { useDroppable } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Sparkles } from 'lucide-react'
import { MONSTER_BY_ID, TIER_DEFINITIONS } from '#/lib/monster-data'
import { cn } from '#/lib/utils'
import MonsterTierCard from './MonsterTierCard'

type MonsterTierLaneProps = {
  tier: (typeof TIER_DEFINITIONS)[number]
  monsterIds: string[]
  disabled: boolean
}

export default function MonsterTierLane({
  tier,
  monsterIds,
  disabled,
}: MonsterTierLaneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: tier.id,
    disabled,
  })

  return (
    <section
      ref={setNodeRef}
      data-tier={tier.id}
      className={cn(
        'tier-lane relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,11,9,0.9),rgba(13,17,15,0.72))] p-5 sm:p-6',
        isOver && 'ring-2 ring-[#adff76]/50',
      )}
    >
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/45">
            {tier.emoji} Tier
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
            {tier.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
            {tier.description}
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/75">
          <Sparkles className="h-4 w-4 text-[#bfff8d]" />
          {monsterIds.length} canette{monsterIds.length > 1 ? 's' : ''}
        </div>
      </div>

      <SortableContext items={monsterIds} strategy={rectSortingStrategy}>
        {monsterIds.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {monsterIds.map((monsterId) => (
              <MonsterTierCard
                key={monsterId}
                monster={MONSTER_BY_ID[monsterId]}
                disabled={disabled}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-36 place-items-center rounded-[1.5rem] border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center text-sm leading-6 text-white/45">
            Depose une canette ici pour remplir ce tier.
          </div>
        )}
      </SortableContext>
    </section>
  )
}
