import { createServerFn } from '@tanstack/react-start'
import {
  isValidFirstName,
  normalizeFirstName,
  normalizeTierAssignments,
} from './monster-data'

function validateFirstNameInput(input: unknown) {
  const firstName =
    input && typeof input === 'object' && 'firstName' in input
      ? input.firstName
      : null

  if (typeof firstName !== 'string' || !isValidFirstName(firstName)) {
    throw new Error('Le prenom est invalide.')
  }

  return {
    firstName: normalizeFirstName(firstName),
  }
}

function validateSaveTierListInput(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new Error('Le payload de sauvegarde est invalide.')
  }

  if (!('firstName' in input) || typeof input.firstName !== 'string') {
    throw new Error('Le prenom est requis.')
  }

  if (!isValidFirstName(input.firstName)) {
    throw new Error('Le prenom est invalide.')
  }

  const assignments =
    'assignments' in input &&
    input.assignments &&
    typeof input.assignments === 'object'
      ? (input.assignments as Record<string, unknown>)
      : null

  return {
    firstName: normalizeFirstName(input.firstName),
    assignments: normalizeTierAssignments(assignments),
  }
}

export const listCommunityTierLists = createServerFn({ method: 'GET' }).handler(
  async () => {
    const { listTierLists } = await import('./tier-list-storage.server')
    return listTierLists(12)
  },
)

export const getUserTierList = createServerFn({ method: 'POST' })
  .inputValidator(validateFirstNameInput)
  .handler(async ({ data }) => {
    const { getTierListByFirstName } =
      await import('./tier-list-storage.server')
    return getTierListByFirstName(data.firstName)
  })

export const saveUserTierList = createServerFn({ method: 'POST' })
  .inputValidator(validateSaveTierListInput)
  .handler(async ({ data }) => {
    const { listTierLists, upsertTierList } =
      await import('./tier-list-storage.server')
    const savedTierList = await upsertTierList(data)
    const community = await listTierLists(12)

    return {
      savedTierList,
      community,
    }
  })
