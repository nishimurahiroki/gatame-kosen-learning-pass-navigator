import axios from 'axios'
import en from '../locales/en.json'
import type { AssessmentRequest, AssessmentResponse } from '../types'

const apiClient = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

function apiFailureMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) {
    return err instanceof Error ? err.message : en.errors.learningPathFailed
  }
  const status = err.response?.status
  const detail =
    typeof err.response?.data === 'object' &&
    err.response?.data !== null &&
    'message' in err.response.data &&
    typeof (err.response.data as { message?: unknown }).message === 'string'
      ? (err.response.data as { message: string }).message
      : undefined

  if (err.response === undefined || err.code === 'ECONNREFUSED') {
    return en.api.backendUnreachable
  }
  if (status === 502 || status === 504) {
    return en.api.proxyFailed
  }
  if (status === 500) {
    return (
      en.api.serverError + (detail ? ` ${detail}` : ` ${en.api.checkBackendLogs}`)
    )
  }
  if (status === 400) {
    return detail ?? en.api.requestRejected
  }
  if (status === 403) {
    return en.api.corsForbidden
  }
  return detail ?? err.message ?? en.errors.learningPathFailed
}

/**
 * 診断フォームの送信結果をバックエンドに送り、推奨モジュール一覧を取得する。
 * @param signal AbortController の signal。タイムアウトや「Cancel」ボタンで中断する用途。
 */
export async function fetchLearningPath(
  request: AssessmentRequest,
  signal?: AbortSignal,
): Promise<AssessmentResponse> {
  try {
    const { data } = await apiClient.post<AssessmentResponse>('/api/assessment', request, {
      signal,
    })
    return data
  } catch (err) {
    if (axios.isCancel?.(err) || (err as { name?: string } | null)?.name === 'CanceledError') {
      throw new DOMException('canceled', 'AbortError')
    }
    throw new Error(apiFailureMessage(err))
  }
}

export function moduleCategoryLabel(moduleId: string): string {
  const labels = en.moduleCategories as Record<string, string>
  return labels[moduleId] ?? labels.fallback
}

/** 診断の userAttribute が未経験セグメントか */
export function isNoviceUser(userAttribute: string): boolean {
  return userAttribute === '未経験'
}

/** 診断パスに並べるテクニックモジュール数（BBS ゲートは含めない）。README §2.3（4 + 1）。 */
export const LEARNING_PATH_TECHNIQUE_COUNT = 4
