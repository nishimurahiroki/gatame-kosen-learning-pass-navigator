import type { AssessmentRequest } from '../types'
import { progressSessionId } from './progressStorage'

const DISMISSED_PREFIX = 'gatame.path-bbs-challenge-promo-dismissed.v1:'

function dismissedKey(req: AssessmentRequest, pathModuleIds: string[]): string {
  const pathSig = [...pathModuleIds].sort().join(',')
  return `${DISMISSED_PREFIX}${progressSessionId(req)}:${pathSig}`
}

export function isPathBbsChallengePromoDismissed(
  req: AssessmentRequest | null | undefined,
  pathModuleIds: string[],
): boolean {
  if (!req || pathModuleIds.length === 0) return false
  try {
    return localStorage.getItem(dismissedKey(req, pathModuleIds)) === '1'
  } catch {
    return false
  }
}

export function markPathBbsChallengePromoDismissed(
  req: AssessmentRequest | null | undefined,
  pathModuleIds: string[],
): void {
  if (!req || pathModuleIds.length === 0) return
  try {
    localStorage.setItem(dismissedKey(req, pathModuleIds), '1')
  } catch {
    /* ignore */
  }
}
