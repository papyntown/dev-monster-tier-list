import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { useServerFn } from '@tanstack/react-start'
import {
  ArrowDownToLine,
  LoaderCircle,
  RefreshCw,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react'
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import CommunityTierCard from './CommunityTierCard'
import MonsterTierCard from './MonsterTierCard'
import MonsterTierLane from './MonsterTierLane'
import {
  MONSTER_BY_ID,
  MONSTER_TOTAL,
  TIER_DEFINITIONS,
  createInitialTierAssignments,
  findTierForMonster,
  isValidFirstName,
  normalizeFirstName,
  normalizeTierAssignments,
  serializeTierAssignments,
  type SavedTierList,
  type TierAssignments,
  type TierId,
} from '#/lib/monster-data'
import {
  getUserTierList,
  listCommunityTierLists,
  saveUserTierList,
} from '#/lib/tier-list-api'
import { cn } from '#/lib/utils'
import { MonsterTierCardPreview } from './MonsterTierCard'

const FIRST_NAME_STORAGE_KEY = 'monster-dev-tier-list:first-name'

const saveStatusLabels = {
  idle: 'Glisse une canette, on synchronise ensuite tout seul.',
  saving: 'Synchronisation de la tier list en cours...',
  saved: 'Tier list synchronisee.',
  error: 'La synchronisation a rate. Tu peux reessayer.',
} as const

function resolveDropTier(
  assignments: TierAssignments,
  overId: string,
): TierId | null {
  const directTier = TIER_DEFINITIONS.find((tier) => tier.id === overId)

  if (directTier) {
    return directTier.id
  }

  return findTierForMonster(assignments, overId)
}

function moveMonsterBetweenTiers(
  assignments: TierAssignments,
  activeId: string,
  overId: string,
) {
  const sourceTier = findTierForMonster(assignments, activeId)
  const targetTier = resolveDropTier(assignments, overId)

  if (!sourceTier || !targetTier) {
    return assignments
  }

  if (sourceTier === targetTier) {
    const items = assignments[sourceTier]
    const oldIndex = items.indexOf(activeId)
    const newIndex =
      overId === targetTier ? items.length - 1 : items.indexOf(overId)

    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
      return assignments
    }

    const nextItems = [...items]
    const [movedItem] = nextItems.splice(oldIndex, 1)
    nextItems.splice(newIndex, 0, movedItem)

    return {
      ...assignments,
      [sourceTier]: nextItems,
    }
  }

  const sourceItems = assignments[sourceTier].filter((id) => id !== activeId)
  const targetItems = assignments[targetTier]
  const targetIndex =
    overId === targetTier ? targetItems.length : targetItems.indexOf(overId)
  const insertionIndex = targetIndex >= 0 ? targetIndex : targetItems.length
  const nextTargetItems = [...targetItems]

  nextTargetItems.splice(insertionIndex, 0, activeId)

  return {
    ...assignments,
    [sourceTier]: sourceItems,
    [targetTier]: nextTargetItems,
  }
}

export default function MonsterTierApp() {
  const loadCommunityTierLists = useServerFn(listCommunityTierLists)
  const loadUserTierList = useServerFn(getUserTierList)
  const persistUserTierList = useServerFn(saveUserTierList)

  const [firstName, setFirstName] = useState('')
  const [draftFirstName, setDraftFirstName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [profileReady, setProfileReady] = useState(false)
  const [assignments, setAssignments] = useState<TierAssignments>(() =>
    createInitialTierAssignments(),
  )
  const [communityTierLists, setCommunityTierLists] = useState<SavedTierList[]>(
    [],
  )
  const [communityState, setCommunityState] = useState<
    'loading' | 'ready' | 'error'
  >('loading')
  const [boardState, setBoardState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [activeMonsterId, setActiveMonsterId] = useState<string | null>(null)

  const hasInteractedRef = useRef(false)
  const lastSavedSnapshotRef = useRef(
    serializeTierAssignments(createInitialTierAssignments()),
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor),
  )

  const refreshFromServer = useEffectEvent(async (profileName: string) => {
    setCommunityState('loading')
    setBoardState(profileName ? 'loading' : 'idle')

    const [communityResult, boardResult] = await Promise.allSettled([
      loadCommunityTierLists(),
      profileName
        ? loadUserTierList({
            data: {
              firstName: profileName,
            },
          })
        : Promise.resolve(null),
    ])

    if (communityResult.status === 'fulfilled') {
      startTransition(() => {
        setCommunityTierLists(communityResult.value)
      })
      setCommunityState('ready')
    } else {
      setCommunityState('error')
    }

    if (!profileName) {
      setBoardState('idle')
      return
    }

    if (boardResult.status === 'fulfilled') {
      const savedTierList = boardResult.value
      const nextAssignments = savedTierList
        ? normalizeTierAssignments(savedTierList.assignments)
        : createInitialTierAssignments()

      setAssignments(nextAssignments)
      lastSavedSnapshotRef.current = serializeTierAssignments(nextAssignments)
      setBoardState('ready')
      return
    }

    setAssignments(createInitialTierAssignments())
    lastSavedSnapshotRef.current = serializeTierAssignments(
      createInitialTierAssignments(),
    )
    setBoardState('error')
  })

  const persistBoard = useEffectEvent(
    async (nextAssignments: TierAssignments) => {
      if (!firstName) {
        return
      }

      const snapshot = serializeTierAssignments(nextAssignments)

      setSaveState('saving')

      try {
        const result = await persistUserTierList({
          data: {
            firstName,
            assignments: nextAssignments,
          },
        })

        lastSavedSnapshotRef.current = snapshot

        startTransition(() => {
          setCommunityTierLists(result.community)
        })

        setSaveState('saved')
      } catch {
        setSaveState('error')
      }
    },
  )

  useEffect(() => {
    const storedFirstName = window.localStorage.getItem(FIRST_NAME_STORAGE_KEY)

    if (storedFirstName && isValidFirstName(storedFirstName)) {
      const normalized = normalizeFirstName(storedFirstName)
      setFirstName(normalized)
      setDraftFirstName(normalized)
    }

    setProfileReady(true)
  }, [])

  useEffect(() => {
    if (!profileReady) {
      return
    }

    void refreshFromServer(firstName)
  }, [firstName, profileReady, refreshFromServer])

  useEffect(() => {
    if (
      !profileReady ||
      !firstName ||
      !hasInteractedRef.current ||
      boardState === 'loading'
    ) {
      return
    }

    const snapshot = serializeTierAssignments(assignments)

    if (snapshot === lastSavedSnapshotRef.current) {
      return
    }

    const timeout = window.setTimeout(() => {
      void persistBoard(assignments)
    }, 700)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [assignments, boardState, firstName, persistBoard, profileReady])

  function handleSaveFirstName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isValidFirstName(draftFirstName)) {
      setNameError('Entre un prenom simple, entre 2 et 24 caracteres.')
      return
    }

    const normalized = normalizeFirstName(draftFirstName)

    window.localStorage.setItem(FIRST_NAME_STORAGE_KEY, normalized)
    setFirstName(normalized)
    setDraftFirstName(normalized)
    setNameError(null)
    setSaveState('idle')
    hasInteractedRef.current = false
  }

  function handleForgetFirstName() {
    window.localStorage.removeItem(FIRST_NAME_STORAGE_KEY)
    setFirstName('')
    setDraftFirstName('')
    setAssignments(createInitialTierAssignments())
    lastSavedSnapshotRef.current = serializeTierAssignments(
      createInitialTierAssignments(),
    )
    setSaveState('idle')
    setBoardState('idle')
    setNameError(null)
    hasInteractedRef.current = false
  }

  function handleManualRefresh() {
    if (profileReady) {
      void refreshFromServer(firstName)
    }
  }

  function handleResetBoard() {
    hasInteractedRef.current = true
    setAssignments(createInitialTierAssignments())
    setSaveState('idle')
  }

  function handlePublishNow() {
    hasInteractedRef.current = true
    void persistBoard(assignments)
  }

  function onDragStart(event: DragStartEvent) {
    setActiveMonsterId(String(event.active.id))
  }

  function onDragEnd(event: DragEndEvent) {
    setActiveMonsterId(null)

    if (!event.over) {
      return
    }

    const activeId = String(event.active.id)
    const overId = String(event.over.id)
    const nextAssignments = moveMonsterBetweenTiers(
      assignments,
      activeId,
      overId,
    )

    if (nextAssignments === assignments) {
      return
    }

    hasInteractedRef.current = true
    setSaveState('idle')
    setAssignments(nextAssignments)
  }

  const activeMonster = activeMonsterId ? MONSTER_BY_ID[activeMonsterId] : null
  const tastedCount = MONSTER_TOTAL - assignments.untasted.length
  const machineCount = assignments.machine.length
  const overlayVisible = profileReady && !firstName

  return (
    <>
      {overlayVisible ? (
        <section className="fixed inset-0 z-[70] grid place-items-center bg-[rgba(6,10,8,0.72)] px-4 backdrop-blur-xl">
          <div className="monster-onboarding w-full max-w-xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,10,9,0.95),rgba(14,17,16,0.9))] p-6 shadow-[0_32px_65px_rgba(0,0,0,0.38)] sm:p-8">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#97f06f]">
              Premiere visite obligatoire
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Choisis ton prenom avant de classer les canettes.
            </h1>
            <p className="mt-3 text-base leading-7 text-white/62">
              Il sera garde en local sur ton navigateur, puis reutilise pour
              signer automatiquement ta tier list publique.
            </p>
            <form className="mt-7 space-y-4" onSubmit={handleSaveFirstName}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white/80">
                  Ton prenom de dev
                </span>
                <input
                  value={draftFirstName}
                  onChange={(event) => setDraftFirstName(event.target.value)}
                  placeholder="Ex: Antoine"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-[#aaff76] focus:ring-2 focus:ring-[#aaff76]/35"
                />
              </label>
              {nameError ? (
                <p className="rounded-2xl border border-[#ff7b7b]/30 bg-[#ff7b7b]/10 px-4 py-3 text-sm text-[#ffd3d3]">
                  {nameError}
                </p>
              ) : null}
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#aaff76]/30 bg-[linear-gradient(90deg,rgba(126,208,83,0.96),rgba(182,255,118,0.94))] px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#10220d] shadow-[0_14px_30px_rgba(121,220,84,0.24)] transition hover:-translate-y-0.5"
              >
                <Zap className="h-4 w-4" />
                Entrer dans la machine
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <main
        className={cn(
          'page-wrap monster-page px-4 pb-16 pt-10 sm:pt-14',
          overlayVisible &&
            'pointer-events-none select-none blur-[4px] saturate-75',
        )}
      >
        <section className="monster-hero relative overflow-hidden rounded-[2.6rem] border border-white/10 bg-[linear-gradient(145deg,rgba(7,11,9,0.92),rgba(12,18,14,0.76),rgba(26,35,20,0.68))] px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-y-0 right-[-10%] w-[38%] bg-[radial-gradient(circle,rgba(170,255,118,0.22),transparent_62%)] blur-3xl" />
          <div className="pointer-events-none absolute left-[-8%] top-[-10%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(83,222,145,0.18),transparent_68%)] blur-3xl" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_360px]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#aefb7f]">
                Monster Dev Tier List
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl leading-[0.94] font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
                Classe les canettes comme si ton prochain sprint dependait d
                elles.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-white/62 sm:text-lg">
                Le catalogue est precharge depuis notre JSON Monster, ton prenom
                est memorise en local, et chaque deplacement de canette peut
                partir au backend pour faire vivre la honte ou la gloire de ton
                palais.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handlePublishNow}
                  disabled={!firstName || saveState === 'saving'}
                  className="inline-flex items-center gap-2 rounded-full border border-[#aaff76]/30 bg-[rgba(146,255,106,0.14)] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-[#d6ffc2] no-underline transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {saveState === 'saving' ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownToLine className="h-4 w-4" />
                  )}
                  Publier ma tier list
                </button>
                <a
                  href="#communaute"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.16em] text-white/80 no-underline transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  <Trophy className="h-4 w-4" />
                  Voir les autres devs
                </a>
              </div>
            </div>
            <aside className="rounded-[2rem] border border-white/10 bg-black/24 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(171,255,117,0.18),rgba(171,255,117,0.04))] text-[#c6ff9a]">
                  <UserRound className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/45">
                    Profil courant
                  </p>
                  <p className="mt-1 text-xl font-semibold text-white">
                    {firstName || 'Prenom requis'}
                  </p>
                </div>
              </div>
              <p className="mt-5 rounded-[1.3rem] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/62">
                {saveStatusLabels[saveState]}
              </p>
              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleManualRefresh}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rafraichir la communaute
                </button>
                <button
                  type="button"
                  onClick={handleForgetFirstName}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-sm font-semibold text-white/72 transition hover:bg-white/6 hover:text-white"
                >
                  Changer de prenom
                </button>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="monster-stat rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,13,12,0.94),rgba(12,16,15,0.72))] p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45">
              Catalogue embarque
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {MONSTER_TOTAL}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Toutes les canettes disponibles dans `monster.json`.
            </p>
          </article>
          <article className="monster-stat rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,13,12,0.94),rgba(12,16,15,0.72))] p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45">
              Degustees par toi
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {tastedCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              {assignments.untasted.length} sont encore en attente dans le
              backlog.
            </p>
          </article>
          <article className="monster-stat rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(9,13,12,0.94),rgba(12,16,15,0.72))] p-5">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/45">
              Niveau machine
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-white">
              {machineCount}
            </p>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Les carburants capables de te faire croire au clean architecture.
            </p>
          </article>
        </section>

        <section id="tiers" className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#97f06f]">
                Board principal
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
                Glisse les canettes dans les 5 niveaux.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResetBoard}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,58,64,0.12)] bg-white/60 px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5"
              >
                Reinitialiser
              </button>
              <button
                type="button"
                onClick={handlePublishNow}
                disabled={saveState === 'saving' || !firstName}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(126,208,83,0.34)] bg-[rgba(171,255,117,0.16)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
              >
                Synchroniser maintenant
              </button>
            </div>
          </div>
          {boardState === 'loading' ? (
            <div className="rounded-[1.8rem] border border-[rgba(23,58,64,0.12)] bg-white/70 px-5 py-4 text-sm font-medium text-[var(--sea-ink-soft)]">
              On recharge ta tier list publiee pour {firstName}...
            </div>
          ) : null}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          >
            <div className="space-y-4">
              {TIER_DEFINITIONS.map((tier) => (
                <MonsterTierLane
                  key={tier.id}
                  tier={tier}
                  monsterIds={assignments[tier.id]}
                  disabled={!firstName || boardState === 'loading'}
                />
              ))}
            </div>
            <DragOverlay>
              {activeMonster ? (
                <MonsterTierCardPreview monster={activeMonster} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </section>

        <section id="communaute" className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#97f06f]">
                Hall of fame
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--sea-ink)] sm:text-4xl">
                Les tier lists des autres devs.
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sea-ink-soft)]">
                Chaque carte est alimentee par le backend TanStack Start. Tant
                que `DATABASE_URL` n est pas branche, on persiste localement
                pour continuer le dev sans attendre Neon.
              </p>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(23,58,64,0.12)] bg-white/60 px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] transition hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4" />
              Rafraichir
            </button>
          </div>
          {communityState === 'loading' ? (
            <div className="mt-5 rounded-[1.8rem] border border-[rgba(23,58,64,0.12)] bg-white/70 px-5 py-4 text-sm font-medium text-[var(--sea-ink-soft)]">
              Chargement des classements communautaires...
            </div>
          ) : null}
          {communityState === 'error' ? (
            <div className="mt-5 rounded-[1.8rem] border border-[rgba(176,73,73,0.18)] bg-[rgba(255,247,247,0.82)] px-5 py-4 text-sm font-medium text-[#7b4040]">
              Impossible de recuperer les tier lists publiques pour le moment.
            </div>
          ) : null}
          {communityState === 'ready' && communityTierLists.length === 0 ? (
            <div className="mt-5 rounded-[1.8rem] border border-[rgba(23,58,64,0.12)] bg-white/70 px-5 py-4 text-sm font-medium text-[var(--sea-ink-soft)]">
              Personne n a encore ose publier son classement. A toi d ouvrir le
              bal.
            </div>
          ) : null}
          {communityTierLists.length > 0 ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {communityTierLists.map((tierList) => (
                <CommunityTierCard
                  key={tierList.firstNameKey}
                  tierList={tierList}
                />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </>
  )
}
