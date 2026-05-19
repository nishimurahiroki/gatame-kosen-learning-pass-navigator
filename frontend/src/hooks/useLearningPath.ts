import { useCallback, useEffect, useRef, useState } from 'react'
import { loadRemoteLearningPath } from '../api/supabaseProgressApi'
import { flushSyncQueue, syncClearLearningPath, syncLearningPath } from '../sync/syncService'
import { fetchLearningPath } from '../api/learningPathApi'
import en from '../locales/en.json'
import type { AssessmentRequest, AssessmentResponse } from '../types'
import {
  clearSavedLearningPath,
  loadSavedLearningPath,
  saveSavedLearningPath,
} from '../utils/learningPathPersistence'

/** 学習パス生成のタイムアウト（25 秒） */
export const LEARNING_PATH_TIMEOUT_MS = 25_000

function isAbortError(err: unknown): boolean {
  if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
    return err.name === 'AbortError'
  }
  return (err as { name?: string } | null)?.name === 'AbortError'
}

interface UseLearningPathState {
  data: AssessmentResponse | null
  loading: boolean
  error: string | null
}

/**
 * 学習パス取得ロジック。
 *
 * - 初回ハイドレーション: まず localStorage のキャッシュを即時表示（体感速度を確保）、
 *   次に Supabase からリモートデータを取得して新しい方を採用する。
 * - 書き込み: localStorage キャッシュ + 同期アウトボックス経由で Supabase へ送信（失敗時は起動時リトライ）。
 * - Supabase 未設定 / オフライン時は localStorage フォールバックで継続。
 */
export function useLearningPath(userId: string | undefined) {
  const [state, setState] = useState<UseLearningPathState>({
    data: null,
    loading: false,
    error: null,
  })
  const [lastAssessment, setLastAssessment] = useState<AssessmentRequest | null>(null)
  const [hydrated, setHydrated] = useState(false)
  /** 進行中のリクエストを Cancel するための AbortController（同時 1 件） */
  const inflightRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!userId) {
      setHydrated(true)
      return
    }

    let cancelled = false

    const hydrate = async () => {
      // Step 1: localStorage キャッシュを即時表示（ちらつき防止）
      const local = loadSavedLearningPath(userId)
      if (local && !cancelled) {
        setState({ data: local.response, loading: false, error: null })
        setLastAssessment(local.assessmentRequest)
      }

      // Step 2: 未送信があれば先にクラウドへ送る（続きから学習の信頼性）
      await flushSyncQueue(userId)
      if (cancelled) return

      // Step 3: Supabase からリモートデータを取得
      let remote = await loadRemoteLearningPath(userId)
      if (cancelled) return

      const localSavedAt = local?.savedAt ?? 0
      const remoteSavedAt = remote?.savedAt ?? 0

      // ローカルキャッシュの方が新しいのにクラウドが古い → 再送してから表示
      if (local && localSavedAt > remoteSavedAt) {
        syncLearningPath(userId, local.assessmentRequest, local.response)
        await flushSyncQueue(userId)
        if (cancelled) return
        remote = await loadRemoteLearningPath(userId)
      }

      if (remote) {
        if (remote.savedAt >= localSavedAt) {
          setState({ data: remote.response, loading: false, error: null })
          setLastAssessment(remote.assessmentRequest)
          saveSavedLearningPath(userId, remote.assessmentRequest, remote.response)
        }
      }

      if (!cancelled) setHydrated(true)
    }

    void hydrate()

    // userId がある時点で必ず setHydrated を呼ぶ（非同期失敗時の保険）
    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setHydrated(true)
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
    }
  }, [userId])

  const persist = useCallback(
    (request: AssessmentRequest, response: AssessmentResponse) => {
      if (!userId) return
      saveSavedLearningPath(userId, request, response)
      syncLearningPath(userId, request, response)
    },
    [userId],
  )

  const generate = useCallback(
    async (request: AssessmentRequest, options?: { soft?: boolean }) => {
      // 既に進行中のリクエストがあれば中断（新しい生成が常に優先）
      inflightRef.current?.abort()
      const controller = new AbortController()
      inflightRef.current = controller

      const timeoutId = window.setTimeout(() => {
        controller.abort()
      }, LEARNING_PATH_TIMEOUT_MS)

      if (options?.soft) {
        setState((s) => ({ ...s, loading: true, error: null }))
      } else {
        setState({ data: null, loading: true, error: null })
      }
      try {
        const data = await fetchLearningPath(request, controller.signal)
        setLastAssessment(request)
        setState({ data, loading: false, error: null })
        persist(request, data)
      } catch (err) {
        const canceled = isAbortError(err)
        // タイムアウトかユーザー Cancel かを区別: setTimeout が発火済みなら timeout
        const timedOut = canceled && !controller.signal.reason && false
        // signal.reason が空でも、controller を timeout で abort した場合は timeoutId が走り終わっているので
        // ここでは「timeout か Cancel か」の判定は呼び出し元の cancel フラグで行うのが確実。
        // よってメッセージはまとめて『canceled / timed out』と扱い、トーストは呼び出し元で出す。
        const soft = options?.soft
        const message = canceled
          ? en.api.requestCanceled
          : err instanceof Error
            ? err.message
            : en.errors.learningPathFailed
        setState((s) => ({
          data: soft ? s.data : null,
          loading: false,
          error: canceled && soft ? null : message,
        }))
        if (!soft && !canceled) {
          throw err instanceof Error ? err : new Error(message)
        }
        if (canceled && !soft) {
          // 初回フェッチがキャンセル/タイムアウトしたら呼び出し元（NavigatorApp）で診断画面に戻れるよう throw
          const e = new Error(message)
          e.name = 'AbortError'
          throw e
        }
        void timedOut
      } finally {
        window.clearTimeout(timeoutId)
        if (inflightRef.current === controller) inflightRef.current = null
      }
    },
    [persist],
  )

  /** 進行中のリクエストを即座に中断（ユーザーが Cancel ボタンを押した時など）。 */
  const cancel = useCallback(() => {
    inflightRef.current?.abort()
    inflightRef.current = null
  }, [])

  const reset = useCallback(() => {
    cancel()
    if (userId) {
      clearSavedLearningPath(userId)
      syncClearLearningPath(userId)
    }
    setLastAssessment(null)
    setState({ data: null, loading: false, error: null })
  }, [cancel, userId])

  return { ...state, lastAssessment, hydrated, generate, reset, cancel }
}
