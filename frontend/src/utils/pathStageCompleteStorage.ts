import type { AssessmentRequest } from '../types'
import { assessmentFingerprint, pathModuleSignature } from './progressStorage'

const DISMISSED_PREFIX = 'gatame.path-stage-complete-dismissed.v1:'

function dismissedKey(req: AssessmentRequest | null, pathModuleIds: string[]): string {
  return DISMISSED_PREFIX + assessmentFingerprint(req) + ':' + pathModuleSignature(pathModuleIds)
}

/** 当該パス構成でステージ完了プロンプトを「Not now」済みか */
export function isPathStageCompleteDismissed(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): boolean {
  if (!req || pathModuleIds.length === 0) return false
  try {
    return localStorage.getItem(dismissedKey(req, pathModuleIds)) === '1'
  } catch {
    return false
  }
}

export function markPathStageCompleteDismissed(
  req: AssessmentRequest | null,
  pathModuleIds: string[],
): void {
  if (!req || pathModuleIds.length === 0) return
  try {
    localStorage.setItem(dismissedKey(req, pathModuleIds), '1')
  } catch {
    /* ignore */
  }
}
