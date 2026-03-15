import '@tanstack/react-start/server-only'

import { neon } from '@neondatabase/serverless'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  getFirstNameKey,
  normalizeFirstName,
  normalizeTierAssignments,
  type SavedTierList,
  type TierAssignments,
} from './monster-data'

const LOCAL_STORAGE_FILE = resolve(
  process.cwd(),
  'data',
  'community-tier-lists.local.json',
)

type NeonTierListRow = {
  first_name: string
  first_name_key: string
  assignments: unknown
  created_at: string | Date
  updated_at: string | Date
}

function getDatabaseClient() {
  const databaseUrl = process.env.DATABASE_URL

  return databaseUrl ? neon(databaseUrl) : null
}

async function ensureDatabaseTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS monster_tier_lists (
      first_name_key TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      assignments JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

function parseAssignments(value: unknown) {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>
    } catch {
      return null
    }
  }

  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }

  return null
}

function sanitizeStoredTierList(value: Partial<SavedTierList>): SavedTierList {
  const now = new Date().toISOString()
  const firstName = normalizeFirstName(value.firstName ?? 'Anonyme')

  return {
    firstName,
    firstNameKey: value.firstNameKey || getFirstNameKey(firstName),
    assignments: normalizeTierAssignments(value.assignments),
    createdAt: value.createdAt ?? now,
    updatedAt: value.updatedAt ?? now,
  }
}

function mapNeonRow(row: NeonTierListRow): SavedTierList {
  return sanitizeStoredTierList({
    firstName: row.first_name,
    firstNameKey: row.first_name_key,
    assignments: parseAssignments(row.assignments) ?? undefined,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  })
}

async function readLocalTierLists() {
  try {
    const content = await readFile(LOCAL_STORAGE_FILE, 'utf8')
    const parsed = JSON.parse(content)

    if (!Array.isArray(parsed)) {
      return [] as SavedTierList[]
    }

    return parsed
      .map((entry) => sanitizeStoredTierList(entry))
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return [] as SavedTierList[]
    }

    throw error
  }
}

async function writeLocalTierLists(records: SavedTierList[]) {
  await mkdir(resolve(process.cwd(), 'data'), { recursive: true })
  await writeFile(LOCAL_STORAGE_FILE, JSON.stringify(records, null, 2))
}

export async function listTierLists(limit = 12) {
  const sql = getDatabaseClient()

  if (sql) {
    await ensureDatabaseTable(sql)

    const rows = await sql<NeonTierListRow[]>`
      SELECT first_name, first_name_key, assignments, created_at, updated_at
      FROM monster_tier_lists
      ORDER BY updated_at DESC
      LIMIT ${limit}
    `

    return rows.map(mapNeonRow)
  }

  const localRecords = await readLocalTierLists()
  return localRecords.slice(0, limit)
}

export async function getTierListByFirstName(firstName: string) {
  const firstNameKey = getFirstNameKey(firstName)
  const sql = getDatabaseClient()

  if (sql) {
    await ensureDatabaseTable(sql)

    const [row] = await sql<NeonTierListRow[]>`
      SELECT first_name, first_name_key, assignments, created_at, updated_at
      FROM monster_tier_lists
      WHERE first_name_key = ${firstNameKey}
      LIMIT 1
    `

    return row ? mapNeonRow(row) : null
  }

  const localRecords = await readLocalTierLists()
  return (
    localRecords.find((record) => record.firstNameKey === firstNameKey) ?? null
  )
}

export async function upsertTierList(input: {
  firstName: string
  assignments: TierAssignments
}) {
  const firstName = normalizeFirstName(input.firstName)
  const firstNameKey = getFirstNameKey(firstName)
  const assignments = normalizeTierAssignments(input.assignments)
  const sql = getDatabaseClient()

  if (sql) {
    await ensureDatabaseTable(sql)

    await sql`
      INSERT INTO monster_tier_lists (first_name_key, first_name, assignments)
      VALUES (
        ${firstNameKey},
        ${firstName},
        ${JSON.stringify(assignments)}::jsonb
      )
      ON CONFLICT (first_name_key)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        assignments = EXCLUDED.assignments,
        updated_at = NOW()
    `

    const [savedRecord] = await sql<NeonTierListRow[]>`
      SELECT first_name, first_name_key, assignments, created_at, updated_at
      FROM monster_tier_lists
      WHERE first_name_key = ${firstNameKey}
      LIMIT 1
    `

    return mapNeonRow(savedRecord)
  }

  const localRecords = await readLocalTierLists()
  const previousRecord = localRecords.find(
    (record) => record.firstNameKey === firstNameKey,
  )
  const now = new Date().toISOString()
  const nextRecord = sanitizeStoredTierList({
    firstName,
    firstNameKey,
    assignments,
    createdAt: previousRecord?.createdAt ?? now,
    updatedAt: now,
  })

  const withoutCurrentUser = localRecords.filter(
    (record) => record.firstNameKey !== firstNameKey,
  )
  const nextRecords = [nextRecord, ...withoutCurrentUser].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  )

  await writeLocalTierLists(nextRecords)

  return nextRecord
}
