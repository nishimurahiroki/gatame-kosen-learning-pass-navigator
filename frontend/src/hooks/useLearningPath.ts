import { useCallback, useEffect, useRef, useState } from 'react'
import { extractGeneratedPathModules } from '../api/streetPathWithBbs'
import { loadRemoteLearningPath } from '../api/supabaseProgressApi'
import {
  flushSyncQueue,
  flushSyncQueueImmediate,
  syncClearLearningPath,
  syncLearningPath,
  syncModuleProgress,
} from '../sync/syncService'
import {
  fetchLearningPath,
  isRetryableLearningPathError,
  prewarmBackendHealth,
} from '../api/learningPathApi'
import { mergeGuestOnSignIn } from '../sync/mergeGuestOnSignIn'
import en from '../locales/en.json'
import type { AssessmentRequest, AssessmentResponse } from '../types'
import {
  clearSavedLearningPath,
  loadSavedLearningPath,
  saveSavedLearningPath,
} from '../utils/learningPathPersistence'
import { markPathGeneratedThisSession } from '../utils/practiceCheckPersistence'
import { getGuestStorageId } from '../utils/guestDevice'
import {
  buildCompletedModuleIdsForRegeneration,
  clearPathSessionProgress,
  ensurePathSessionAligned,
  initializePathSessionProgress,
  loadBbsDeclaredMasteredLevels,
  loadLifetimeMasteredModuleIds,
  progressSessionId,
  promotePathSessionToLifetime,
} from '../utils/progressStorage'

/** 学習パス生成の 1 回あたりのタイムアウト（本番: Render コールドスタート対策） */
export const LEARNING_PATH_TIMEOUT_MS = import.meta.env.PROD ? 90_000 : 25_000

const LEARNING_PATH_MAX_ATTEMPTS = 2

export type PathGenerationHint = 'default' | 'retry'

export type UseLearningPathOptions = {
  /** localStorage キー（Guest: guest:deviceId / Member: userId） */
  storageId: string
  /** 設定時のみ Supabase 同期（Member） */
  syncUserId?: string
}

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
 * 学習パス取得（Guest / Member）。
 *
 * - Guest: storageId のみ。local ハイドレーション。Supabase 書き込みなし。
 * - Member: local 即時表示 → flush → remote マージ（README §8.1）。
 */
export function useLearningPath({ storageId, syncUserId }: UseLearningPathOptions) {
  const [state, setState] = useState<UseLearningPathState>({
    data: null,
    loading: false,
    error: null,
  })
  const [lastAssessment, setLastAssessment] = useState<AssessmentRequest | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [generationHint, setGenerationHint] = useState<PathGenerationHint | null>(null)
  const inflightRef = useRef<AbortController | null>(null)
  const userCanceledRef = useRef(false)
  const nextPathInFlightRef = useRef(false)
  const lastAssessmentRef = useRef<AssessmentRequest | null>(null)
  const dataRef = useRef<AssessmentResponse | null>(null)

  lastAssessmentRef.current = lastAssessment
  dataRef.current = state.data

  useEffect(() => {
    if (!storageId) {
      setHydrated(true)
      return
    }

    let cancelled = false

    const alignSessionForSnapshot = (request: AssessmentRequest, response: AssessmentResponse) => {
      const pathModuleIds = extractGeneratedPathModules(response.recommendedModules ?? []).map(
        (m) => m.id,
      )
      ensurePathSessionAligned(request, pathModuleIds)
    }

    const hydrate = async () => {
      // §10.8: Magic Link 後は guestLocal を member キーへマージしてから読み込む
      if (syncUserId) {
        await mergeGuestOnSignIn(getGuestStorageId(), syncUserId)
        if (cancelled) return
      }

      const local = loadSavedLearningPath(storageId)
      if (local && !cancelled) {
        alignSessionForSnapshot(local.assessmentRequest, local.response)
        setState({ data: local.response, loading: false, error: null })
        setLastAssessment(local.assessmentRequest)
      }

      if (!syncUserId) {
        if (!cancelled) setHydrated(true)
        return
      }

      await flushSyncQueue(syncUserId)
      if (cancelled) return

      let remote = await loadRemoteLearningPath(syncUserId)
      if (cancelled) return

      const localSavedAt = local?.savedAt ?? 0
      const remoteSavedAt = remote?.savedAt ?? 0

      if (local && localSavedAt > remoteSavedAt) {
        syncLearningPath(syncUserId, local.assessmentRequest, local.response)
        await flushSyncQueue(syncUserId)
        if (cancelled) return
        remote = await loadRemoteLearningPath(syncUserId)
      }

      if (remote && remote.savedAt >= localSavedAt) {
        alignSessionForSnapshot(remote.assessmentRequest, remote.response)
        setState({ data: remote.response, loading: false, error: null })
        setLastAssessment(remote.assessmentRequest)
        saveSavedLearningPath(storageId, remote.assessmentRequest, remote.response)
      }

      if (!cancelled) setHydrated(true)
    }

    void hydrate()

    const fallbackTimer = window.setTimeout(() => {
      if (!cancelled) setHydrated(true)
    }, 5000)

    return () => {
      cancelled = true
      window.clearTimeout(fallbackTimer)
    }
  }, [storageId, syncUserId])

  useEffect(() => {
    if (!hydrated) return
    prewarmBackendHealth()
  }, [hydrated])

  const persist = useCallback(
    (request: AssessmentRequest, response: AssessmentResponse) => {
      if (!storageId) return
      saveSavedLearningPath(storageId, request, response)
      if (syncUserId) {
        syncLearningPath(syncUserId, request, response)
      }
    },
    [storageId, syncUserId],
  )

  const generate = useCallback(
    async (
      request: AssessmentRequest,
      options?: { soft?: boolean },
    ): Promise<AssessmentResponse | undefined> => {
      inflightRef.current?.abort()
      userCanceledRef.current = false
      setGenerationHint('default')

      if (options?.soft) {
        setState((s) => ({ ...s, loading: true, error: null }))
      } else {
        setState({ data: null, loading: true, error: null })
      }

      const applySuccess = (data: AssessmentResponse) => {
        const pathModuleIds = extractGeneratedPathModules(data.recommendedModules ?? []).map(
          (m) => m.id,
        )
        initializePathSessionProgress(request, pathModuleIds)
        setLastAssessment(request)
        setState({ data, loading: false, error: null })
        persist(request, data)
        markPathGeneratedThisSession(storageId)
        if (syncUserId) {
          syncModuleProgress(syncUserId, progressSessionId(request), {
            sessionCompletedIds: [],
            lifetimeMasteredIds: [...loadLifetimeMasteredModuleIds(request)],
            bbsDeclaredMasteredLevels: [...loadBbsDeclaredMasteredLevels(request)],
          })
          void flushSyncQueueImmediate(syncUserId)
        }
      }

      let lastErr: unknown

      for (let attempt = 0; attempt < LEARNING_PATH_MAX_ATTEMPTS; attempt++) {
        if (attempt > 0) {
          setGenerationHint('retry')
        }

        const controller = new AbortController()
        inflightRef.current = controller
        const timeoutId = window.setTimeout(() => {
          controller.abort()
        }, LEARNING_PATH_TIMEOUT_MS)

        try {
          const data = await fetchLearningPath(request, controller.signal)
          setGenerationHint(null)
          applySuccess(data)
          return data
        } catch (err) {
          lastErr = err
          if (userCanceledRef.current) break
          const canRetry =
            attempt < LEARNING_PATH_MAX_ATTEMPTS - 1 && isRetryableLearningPathError(err)
          if (!canRetry) break
        } finally {
          window.clearTimeout(timeoutId)
          if (inflightRef.current === controller) inflightRef.current = null
        }
      }

      setGenerationHint(null)
      const err = lastErr
      const canceled = isAbortError(err) || userCanceledRef.current
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
        const e = new Error(message)
        e.name = 'AbortError'
        throw e
      }
      if (!canceled) {
        throw err instanceof Error ? err : new Error(message)
      }
      return undefined
    },
    [persist, storageId, syncUserId],
  )

  const generateNextPath = useCallback(async () => {
    if (nextPathInFlightRef.current) return

    const request = lastAssessmentRef.current
    const response = dataRef.current
    if (!request || !response) {
      throw new Error(en.errors.assessmentIncomplete)
    }

    nextPathInFlightRef.current = true
    try {
      const pathModuleIds = extractGeneratedPathModules(response.recommendedModules ?? []).map(
        (m) => m.id,
      )
      promotePathSessionToLifetime(request, pathModuleIds)

      const completedModuleIds = buildCompletedModuleIdsForRegeneration(request)
      const nextRequest: AssessmentRequest = {
        ...request,
        completedModuleIds,
        aspirations: request.aspirations ?? [],
        problems: request.problems ?? [],
      }

      const newData = await generate(nextRequest, { soft: true })
      if (!newData) {
        throw new Error(en.errors.learningPathFailed)
      }
      const newPathIds = extractGeneratedPathModules(newData.recommendedModules ?? []).map(
        (m) => m.id,
      )
      if (newPathIds.length === 0) {
        throw new Error(en.errors.noModulesRemaining)
      }
    } finally {
      nextPathInFlightRef.current = false
    }
  }, [generate])

  const cancel = useCallback(() => {
    userCanceledRef.current = true
    inflightRef.current?.abort()
    inflightRef.current = null
    setGenerationHint(null)
  }, [])

  const reset = useCallback(() => {
    cancel()
    if (lastAssessmentRef.current) {
      clearPathSessionProgress(lastAssessmentRef.current)
    }
    if (storageId) {
      clearSavedLearningPath(storageId)
    }
    if (syncUserId) {
      syncClearLearningPath(syncUserId)
    }
    setLastAssessment(null)
    setState({ data: null, loading: false, error: null })
  }, [cancel, storageId, syncUserId])

  return {
    ...state,
    lastAssessment,
    hydrated,
    generationHint,
    generate,
    generateNextPath,
    reset,
    cancel,
  }
}
