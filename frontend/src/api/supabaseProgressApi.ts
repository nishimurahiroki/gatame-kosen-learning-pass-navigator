/**
 * Supabase を使ったユーザー進捗の永続化 API。
 *
 * 書き込みは SyncWriteResult を返し、呼び出し元（progressSync）が
 * 失敗時にアウトボックスへ積んでリトライする。
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AssessmentRequest, AssessmentResponse } from '../types'

export type SyncWriteResult = { ok: true } | { ok: false; message: string }

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function getClient(): SupabaseClient | null {
  return supabase
}

function writeFailure(error: { message: string } | null, fallback: string): SyncWriteResult {
  return { ok: false, message: error?.message ?? fallback }
}

// --------------------------------------------------------------------------
// 1. 学習パス (user_learning_paths)
// --------------------------------------------------------------------------

export interface RemoteLearningPath {
  assessmentRequest: AssessmentRequest
  response: AssessmentResponse
  savedAt: number
}

export async function loadRemoteLearningPath(userId: string): Promise<RemoteLearningPath | null> {
  const client = getClient()
  if (!client || !userId) return null
  try {
    const { data, error } = await client
      .from('user_learning_paths')
      .select('assessment_req, response, saved_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null

    return {
      assessmentRequest: data.assessment_req as AssessmentRequest,
      response: data.response as AssessmentResponse,
      savedAt: new Date(data.saved_at as string).getTime(),
    }
  } catch {
    return null
  }
}

export async function saveRemoteLearningPath(
  userId: string,
  assessmentRequest: AssessmentRequest,
  response: AssessmentResponse,
): Promise<SyncWriteResult> {
  const client = getClient()
  if (!client || !userId) return { ok: false, message: 'Supabase is not configured' }
  try {
    const { error } = await client.from('user_learning_paths').upsert(
      {
        user_id: userId,
        assessment_req: assessmentRequest,
        response,
        saved_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    if (error) return writeFailure(error, 'Failed to save learning path')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' }
  }
}

export async function clearRemoteLearningPath(userId: string): Promise<SyncWriteResult> {
  const client = getClient()
  if (!client || !userId) return { ok: false, message: 'Supabase is not configured' }
  try {
    const { error } = await client.from('user_learning_paths').delete().eq('user_id', userId)
    if (error) return writeFailure(error, 'Failed to clear learning path')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' }
  }
}

// --------------------------------------------------------------------------
// 2. モジュール完了状態 (user_module_progress)
// --------------------------------------------------------------------------

export interface RemoteModuleProgress {
  sessionCompletedIds: string[]
  lifetimeMasteredIds: string[]
  bbsDeclaredMasteredLevels: string[]
}

export async function loadRemoteModuleProgress(
  userId: string,
  fingerprint: string,
): Promise<RemoteModuleProgress | null> {
  const client = getClient()
  if (!client || !userId || !fingerprint) return null
  try {
    const { data, error } = await client
      .from('user_module_progress')
      .select('session_completed_ids, lifetime_mastered_ids, bbs_declared_mastered_levels')
      .eq('user_id', userId)
      .eq('assessment_fingerprint', fingerprint)
      .maybeSingle()

    if (error || !data) return null

    return {
      sessionCompletedIds: (data.session_completed_ids as string[]) ?? [],
      lifetimeMasteredIds: (data.lifetime_mastered_ids as string[]) ?? [],
      bbsDeclaredMasteredLevels: (data.bbs_declared_mastered_levels as string[]) ?? [],
    }
  } catch {
    return null
  }
}

export async function saveRemoteModuleProgress(
  userId: string,
  fingerprint: string,
  progress: RemoteModuleProgress,
): Promise<SyncWriteResult> {
  const client = getClient()
  if (!client || !userId || !fingerprint) return { ok: false, message: 'Supabase is not configured' }
  try {
    const { error } = await client.from('user_module_progress').upsert(
      {
        user_id: userId,
        assessment_fingerprint: fingerprint,
        session_completed_ids: progress.sessionCompletedIds,
        lifetime_mastered_ids: progress.lifetimeMasteredIds,
        bbs_declared_mastered_levels: progress.bbsDeclaredMasteredLevels,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,assessment_fingerprint' },
    )
    if (error) return writeFailure(error, 'Failed to save module progress')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' }
  }
}

// --------------------------------------------------------------------------
// 3. TODO チェック / Memo (user_module_details)
// --------------------------------------------------------------------------

export interface RemoteModuleDetail {
  checkedItems: Record<string, boolean>
  memo: string
}

export async function loadRemoteSessionDetails(
  userId: string,
  sessionKey: string,
): Promise<Record<string, RemoteModuleDetail>> {
  const client = getClient()
  if (!client || !userId || !sessionKey) return {}
  try {
    const { data, error } = await client
      .from('user_module_details')
      .select('module_id, checked_items, memo')
      .eq('user_id', userId)
      .eq('session_key', sessionKey)

    if (error || !data) return {}

    const result: Record<string, RemoteModuleDetail> = {}
    for (const row of data) {
      result[row.module_id as string] = {
        checkedItems: (row.checked_items as Record<string, boolean>) ?? {},
        memo: (row.memo as string) ?? '',
      }
    }
    return result
  } catch {
    return {}
  }
}

/** TODO と Memo を同一行にまとめて upsert（片方だけ送って他方が消えるのを防ぐ） */
export async function saveRemoteModuleDetail(
  userId: string,
  sessionKey: string,
  moduleId: string,
  detail: RemoteModuleDetail,
): Promise<SyncWriteResult> {
  const client = getClient()
  if (!client || !userId || !sessionKey) return { ok: false, message: 'Supabase is not configured' }
  try {
    const { error } = await client.from('user_module_details').upsert(
      {
        user_id: userId,
        session_key: sessionKey,
        module_id: moduleId,
        checked_items: detail.checkedItems,
        memo: detail.memo,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,session_key,module_id' },
    )
    if (error) return writeFailure(error, 'Failed to save module details')
    return { ok: true }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Network error' }
  }
}
