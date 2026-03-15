import monsterCatalogJson from '../../data/monster.json'

type MonsterCatalogEntry = {
  name: string
  category: string
  slug: string
  productUrl: string
  imageUrl: string
  localImagePath: string
}

type MonsterCatalogFile = {
  generatedAt: string
  locale: string
  source: string
  total: number
  products: MonsterCatalogEntry[]
}

export type MonsterProduct = MonsterCatalogEntry

export const TIER_DEFINITIONS = [
  {
    id: 'untasted',
    emoji: '??',
    label: 'Pas gouter',
    description: 'La canette attend son ticket dans le backlog.',
  },
  {
    id: 'trash',
    emoji: '!!',
    label: 'Poubelle',
    description: 'Erreur 500 dans la bouche. On rollback.',
  },
  {
    id: 'gross-but',
    emoji: '..',
    label: 'Ca degoute mais ...',
    description: 'C est discutable, mais un dev fatigue peut se convaincre.',
  },
  {
    id: 'dev',
    emoji: '<>',
    label: 'Ca dev',
    description: 'Solide, efficace, ca pousse un sprint sans broncher.',
  },
  {
    id: 'machine',
    emoji: '++',
    label: 'Me fais devenir la machine que je pense etre',
    description: 'Le mode production absolu. Plus rien ne compile sans elle.',
  },
] as const

export type TierId = (typeof TIER_DEFINITIONS)[number]['id']

export type TierAssignments = Record<TierId, string[]>

export type SavedTierList = {
  firstName: string
  firstNameKey: string
  assignments: TierAssignments
  createdAt: string
  updatedAt: string
}

const monsterCatalog = monsterCatalogJson as MonsterCatalogFile

function decodePossiblyBrokenUtf8(value: string) {
  try {
    const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0))
    const decoded = new TextDecoder('utf-8').decode(bytes)

    if (!decoded || decoded.includes('\uFFFD')) {
      return value
    }

    return decoded
  } catch {
    return value
  }
}

function cleanMonsterName(value: string) {
  return decodePossiblyBrokenUtf8(value)
    .replace(/^Monster Ultra Ultra /, 'Monster Ultra ')
    .replace(/^Juiced Monster Juiced /, 'Juiced Monster ')
}

function cleanMonsterCategory(value: string) {
  return decodePossiblyBrokenUtf8(value)
}

export const MONSTER_PRODUCTS: MonsterProduct[] = monsterCatalog.products.map(
  (product) => ({
    ...product,
    name: cleanMonsterName(product.name),
    category: cleanMonsterCategory(product.category),
  }),
)

export const MONSTER_BY_ID = Object.fromEntries(
  MONSTER_PRODUCTS.map((monster) => [monster.slug, monster]),
) as Record<string, MonsterProduct>

export const MONSTER_TOTAL = MONSTER_PRODUCTS.length

export function createInitialTierAssignments(): TierAssignments {
  return {
    untasted: MONSTER_PRODUCTS.map((monster) => monster.slug),
    trash: [],
    'gross-but': [],
    dev: [],
    machine: [],
  }
}

export function normalizeTierAssignments(
  input: Partial<Record<string, unknown>> | null | undefined,
): TierAssignments {
  const knownIds = new Set(MONSTER_PRODUCTS.map((monster) => monster.slug))
  const seen = new Set<string>()
  const nextAssignments = {
    untasted: [] as string[],
    trash: [] as string[],
    'gross-but': [] as string[],
    dev: [] as string[],
    machine: [] as string[],
  } satisfies TierAssignments

  for (const tier of TIER_DEFINITIONS) {
    const rawIds = input?.[tier.id]
    if (!Array.isArray(rawIds)) {
      continue
    }

    for (const rawId of rawIds) {
      if (typeof rawId !== 'string') {
        continue
      }

      if (!knownIds.has(rawId) || seen.has(rawId)) {
        continue
      }

      nextAssignments[tier.id].push(rawId)
      seen.add(rawId)
    }
  }

  for (const monster of MONSTER_PRODUCTS) {
    if (!seen.has(monster.slug)) {
      nextAssignments.untasted.push(monster.slug)
    }
  }

  return nextAssignments
}

export function findTierForMonster(
  assignments: TierAssignments,
  monsterId: string,
): TierId | null {
  for (const tier of TIER_DEFINITIONS) {
    if (assignments[tier.id].includes(monsterId)) {
      return tier.id
    }
  }

  return null
}

export function normalizeFirstName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join(' ')
}

export function isValidFirstName(value: string) {
  const normalized = normalizeFirstName(value)

  return (
    normalized.length >= 2 &&
    normalized.length <= 24 &&
    /^[\p{L}][\p{L}' -]*[\p{L}]$/u.test(normalized)
  )
}

export function getFirstNameKey(value: string) {
  return normalizeFirstName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z'-]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function serializeTierAssignments(assignments: TierAssignments) {
  return JSON.stringify(assignments)
}
