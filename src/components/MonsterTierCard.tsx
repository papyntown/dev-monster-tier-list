import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDownToLine } from 'lucide-react'
import { type MonsterProduct } from '#/lib/monster-data'
import { cn } from '#/lib/utils'

type MonsterTierCardProps = {
  monster: MonsterProduct
  disabled?: boolean
}

type MonsterTierCardFrameProps = {
  monster: MonsterProduct
  isDragging?: boolean
  isOverlay?: boolean
  disabled?: boolean
  attributes?: ReturnType<typeof useSortable>['attributes']
  listeners?: ReturnType<typeof useSortable>['listeners']
  cardRef?: ReturnType<typeof useSortable>['setNodeRef']
  style?: {
    transform?: string
    transition?: string
  }
}

function MonsterTierCardFrame({
  monster,
  isDragging = false,
  isOverlay = false,
  disabled = false,
  attributes,
  listeners,
  cardRef,
  style,
}: MonsterTierCardFrameProps) {
  return (
    <article
      ref={cardRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'monster-card-shell group relative flex h-full flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,20,0.98),rgba(10,12,14,0.94))] p-4 text-left text-white shadow-[0_18px_32px_rgba(0,0,0,0.28)]',
        disabled && 'cursor-default',
        !disabled && 'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40 saturate-50',
        isOverlay &&
          'w-[220px] rotate-2 shadow-[0_20px_45px_rgba(140,255,128,0.28)]',
      )}
    >
      <div className="absolute inset-x-5 top-3 h-8 rounded-full bg-[radial-gradient(circle,rgba(163,255,115,0.3),transparent_68%)] blur-xl" />
      <div className="relative flex items-start justify-between gap-3">
        <span className="rounded-full border border-[rgba(177,255,124,0.22)] bg-[rgba(126,208,83,0.14)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#d8ffbc]">
          {monster.category}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/60">
          Drag
        </span>
      </div>

      <div className="relative flex justify-center rounded-[1.4rem] border border-white/6 bg-[radial-gradient(circle_at_50%_0%,rgba(163,255,115,0.14),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] px-4 py-5">
        <img
          src={monster.localImagePath}
          alt={monster.name}
          loading="lazy"
          className="h-36 w-auto object-contain drop-shadow-[0_16px_18px_rgba(0,0,0,0.55)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03]"
        />
      </div>

      <div className="relative flex flex-1 flex-col justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-5 text-white">
            {monster.name}
          </h3>
          <p className="mt-1 text-sm leading-5 text-white/60">
            Cliquez longuement ou glissez la canette vers le tier voulu.
          </p>
        </div>

        <a
          href={monster.productUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#aefb7f] no-underline transition hover:text-[#d4ffbd]"
        >
          Voir la fiche
          <ArrowDownToLine className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  )
}

export function MonsterTierCardPreview({
  monster,
}: {
  monster: MonsterProduct
}) {
  return <MonsterTierCardFrame monster={monster} isOverlay />
}

export default function MonsterTierCard({
  monster,
  disabled = false,
}: MonsterTierCardProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: monster.slug,
    disabled,
  })

  return (
    <MonsterTierCardFrame
      monster={monster}
      disabled={disabled}
      attributes={attributes}
      listeners={listeners}
      cardRef={setNodeRef}
      isDragging={isDragging}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    />
  )
}
