import type { AssessmentRequest, AssessmentResponse } from '../types'
import type { RemoteModuleDetail, RemoteModuleProgress } from '../api/supabaseProgressApi'

export type SyncOp =
  | {
      kind: 'learning_path'
      assessmentRequest: AssessmentRequest
      response: AssessmentResponse
    }
  | { kind: 'clear_learning_path' }
  | {
      kind: 'module_progress'
      fingerprint: string
      progress: RemoteModuleProgress
    }
  | {
      kind: 'module_detail'
      sessionKey: string
      moduleId: string
      detail: RemoteModuleDetail
    }

export interface SyncOutboxEntry {
  /** 同一キーは最新の操作で上書き（連打時の重複送信を防ぐ） */
  key: string
  op: SyncOp
  updatedAt: number
}

export type SyncBannerStatus = 'synced' | 'syncing' | 'pending' | 'error' | 'offline'

export const GATAME_SYNC_CHANGED_EVENT = 'gatame-sync-changed' as const
