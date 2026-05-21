import {
  clearRemoteLearningPath,
  saveRemoteLearningPath,
  saveRemoteModuleDetail,
  saveRemoteModuleProgress,
  type RemoteModuleDetail,
  type RemoteModuleProgress,
  type SyncWriteResult,
} from '../api/supabaseProgressApi'
import type { AssessmentRequest, AssessmentResponse } from '../types'
import { supabase } from '../lib/supabase'
import { isInvalidAuthUserDbError, resolveAuthenticatedUserId } from '../utils/authVerify'
import {
  clearOutbox,
  enqueueOutbox,
  loadOutbox,
  outboxCount,
  removeOutboxKey,
} from './syncOutbox'
import { GATAME_SYNC_CHANGED_EVENT, type SyncOp } from './syncTypes'

export function isBrowserOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine
}

function notifySyncChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(GATAME_SYNC_CHANGED_EVENT))
}

async function executeOp(userId: string, op: SyncOp): Promise<SyncWriteResult> {
  switch (op.kind) {
    case 'learning_path':
      return saveRemoteLearningPath(userId, op.assessmentRequest, op.response)
    case 'clear_learning_path':
      return clearRemoteLearningPath(userId)
    case 'module_progress':
      return saveRemoteModuleProgress(userId, op.fingerprint, op.progress)
    case 'module_detail':
      return saveRemoteModuleDetail(userId, op.sessionKey, op.moduleId, op.detail)
  }
}

export interface FlushSyncResult {
  synced: number
  failed: number
  remaining: number
  /** 直近の Supabase エラーメッセージ（UI 表示用） */
  lastError: string | null
  /** 古いセッション等で auth.users にユーザーが無い */
  authStale: boolean
}

let flushInFlight: Promise<FlushSyncResult> | null = null
let flushUserId: string | null = null

/**
 * アウトボックス内の未送信操作を順に Supabase へ送る。
 * 起動時・オンライン復帰時・ユーザーが「再試行」したときに呼ぶ。
 */
export function flushSyncQueue(userId: string): Promise<FlushSyncResult> {
  if (!userId) {
    return Promise.resolve({
      synced: 0,
      failed: 0,
      remaining: 0,
      lastError: null,
      authStale: false,
    })
  }
  if (flushInFlight && flushUserId === userId) return flushInFlight

  flushUserId = userId
  flushInFlight = (async () => {
    notifySyncChanged()

    const empty = {
      synced: 0,
      failed: 0,
      remaining: outboxCount(userId),
      lastError: null as string | null,
      authStale: false,
    }

    if (!isBrowserOnline()) {
      return empty
    }

    if (!supabase) {
      return { ...empty, lastError: 'Supabase is not configured' }
    }

    const authenticatedId = await resolveAuthenticatedUserId()
    if (!authenticatedId || authenticatedId !== userId) {
      clearOutbox(userId)
      await supabase.auth.signOut()
      notifySyncChanged()
      return {
        synced: 0,
        failed: 0,
        remaining: 0,
        lastError: null,
        authStale: true,
      }
    }

    let synced = 0
    let failed = 0
    let lastError: string | null = null
    let authStale = false
    const entries = loadOutbox(userId)

    for (const entry of entries) {
      if (!isBrowserOnline()) break
      const result = await executeOp(authenticatedId, entry.op)
      if (result.ok) {
        removeOutboxKey(userId, entry.key)
        synced++
      } else {
        failed++
        lastError = result.message
        if (isInvalidAuthUserDbError(result.message)) {
          authStale = true
          clearOutbox(userId)
          await supabase.auth.signOut()
          break
        }
      }
    }

    const remaining = outboxCount(userId)
    notifySyncChanged()
    return { synced, failed, remaining, lastError, authStale }
  })().finally(() => {
    flushInFlight = null
    flushUserId = null
  })

  return flushInFlight
}

function scheduleFlush(userId: string): void {
  void flushSyncQueue(userId)
}

// --------------------------------------------------------------------------
// 公開 API（全操作は enqueue → 即時 flush）
// --------------------------------------------------------------------------

export function syncLearningPath(
  userId: string,
  assessmentRequest: AssessmentRequest,
  response: AssessmentResponse,
): void {
  removeOutboxKey(userId, 'clear_learning_path')
  enqueueOutbox(userId, { kind: 'learning_path', assessmentRequest, response })
  notifySyncChanged()
  scheduleFlush(userId)
}

export function syncClearLearningPath(userId: string): void {
  removeOutboxKey(userId, 'learning_path')
  enqueueOutbox(userId, { kind: 'clear_learning_path' })
  notifySyncChanged()
  scheduleFlush(userId)
}

export function syncModuleProgress(
  userId: string,
  fingerprint: string,
  progress: RemoteModuleProgress,
): void {
  enqueueOutbox(userId, { kind: 'module_progress', fingerprint, progress })
  notifySyncChanged()
  scheduleFlush(userId)
}

export function syncModuleDetail(
  userId: string,
  sessionKey: string,
  moduleId: string,
  detail: RemoteModuleDetail,
): void {
  enqueueOutbox(userId, { kind: 'module_detail', sessionKey, moduleId, detail })
  notifySyncChanged()
  scheduleFlush(userId)
}

export function getPendingSyncCount(userId: string | undefined): number {
  if (!userId) return 0
  return outboxCount(userId)
}

export function clearUserSyncQueue(userId: string): void {
  clearOutbox(userId)
  notifySyncChanged()
}
