import type { AssessmentRequest, AssessmentResponse } from '../types'

const STORAGE_PREFIX = 'gatame.saved-learning-path.v1:'

export type SavedLearningPath = {
  assessmentRequest: AssessmentRequest
  response: AssessmentResponse
  savedAt: number
}

function storageKey(userId: string): string {
  return STORAGE_PREFIX + userId
}

function isAssessmentRequest(value: unknown): value is AssessmentRequest {
  if (!value || typeof value !== 'object') return false
  const r = value as AssessmentRequest
  return typeof r.userAttribute === 'string' && Array.isArray(r.problems)
}

function isAssessmentResponse(value: unknown): value is AssessmentResponse {
  if (!value || typeof value !== 'object') return false
  const r = value as AssessmentResponse
  return (
    typeof r.userAttribute === 'string' &&
    Array.isArray(r.recommendedModules) &&
    typeof r.totalModules === 'number'
  )
}

export function loadSavedLearningPath(userId: string): SavedLearningPath | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    const snap = parsed as SavedLearningPath
    if (!isAssessmentRequest(snap.assessmentRequest) || !isAssessmentResponse(snap.response)) {
      return null
    }
    return snap
  } catch {
    return null
  }
}

export function saveSavedLearningPath(
  userId: string,
  assessmentRequest: AssessmentRequest,
  response: AssessmentResponse,
): void {
  try {
    const payload: SavedLearningPath = {
      assessmentRequest,
      response,
      savedAt: Date.now(),
    }
    localStorage.setItem(storageKey(userId), JSON.stringify(payload))
  } catch {
    /* ストレージ満杯・プライベートモード等は無視 */
  }
}

export function clearSavedLearningPath(userId: string): void {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    /* ignore */
  }
}

/** 診断完了・学習パス生成済みの保存があるか（途中離脱は含まない） */
export function isLocalPathReady(storageId: string): boolean {
  return loadSavedLearningPath(storageId) != null
}
