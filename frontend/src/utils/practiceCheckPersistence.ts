const PRACTICE_STATE_PREFIX = 'gatame.practice-check.v1:'
const AUTO_SHOWN_PREFIX = 'gatame.practice-check.auto-shown.v1:'
const APP_LAUNCH_COUNT_PREFIX = 'gatame.practice-check.app-launch-count.v1:'
const APP_LAUNCH_RECORDED_PREFIX = 'gatame.practice-check.app-launch-recorded.v1:'
const PATH_GENERATED_PREFIX = 'gatame.practice-check.path-generated.v1:'

export type SavedPracticeCheckState = {
  snoozeUntil: number
  updatedAt: number
}

function stateKey(storageId: string, fingerprint: string): string {
  return `${PRACTICE_STATE_PREFIX}${storageId}:${fingerprint}`
}

function autoShownSessionKey(storageId: string): string {
  return `${AUTO_SHOWN_PREFIX}${storageId}`
}

function appLaunchCountKey(storageId: string): string {
  return `${APP_LAUNCH_COUNT_PREFIX}${storageId}`
}

function appLaunchRecordedSessionKey(storageId: string): string {
  return `${APP_LAUNCH_RECORDED_PREFIX}${storageId}`
}

function pathGeneratedSessionKey(storageId: string): string {
  return `${PATH_GENERATED_PREFIX}${storageId}`
}

/** specification.md §11.2 — 2 回目以降のアプリ起動（ブラウザセッション単位で 1 回だけ加算） */
export function bumpAppLaunchCount(storageId: string): number {
  if (!storageId) return 0
  try {
    const raw = localStorage.getItem(appLaunchCountKey(storageId))
    let count = raw ? Number.parseInt(raw, 10) : 0
    if (!Number.isFinite(count) || count < 0) count = 0

    if (sessionStorage.getItem(appLaunchRecordedSessionKey(storageId)) === '1') {
      return count
    }

    sessionStorage.setItem(appLaunchRecordedSessionKey(storageId), '1')
    count += 1
    localStorage.setItem(appLaunchCountKey(storageId), String(count))
    return count
  } catch {
    return 0
  }
}

export function getAppLaunchCount(storageId: string): number {
  if (!storageId) return 0
  try {
    const raw = localStorage.getItem(appLaunchCountKey(storageId))
    const count = raw ? Number.parseInt(raw, 10) : 0
    return Number.isFinite(count) && count > 0 ? count : 0
  } catch {
    return 0
  }
}

/** 同一セッション内のパス新規生成直後は Today's Focus を自動表示しない */
export function markPathGeneratedThisSession(storageId: string): void {
  if (!storageId) return
  try {
    sessionStorage.setItem(pathGeneratedSessionKey(storageId), '1')
  } catch {
    /* ignore */
  }
}

export function isPathGeneratedThisSession(storageId: string): boolean {
  if (!storageId) return false
  try {
    return sessionStorage.getItem(pathGeneratedSessionKey(storageId)) === '1'
  } catch {
    return false
  }
}

export function isPracticeCheckAutoShownThisSession(storageId: string): boolean {
  if (!storageId) return false
  try {
    return sessionStorage.getItem(autoShownSessionKey(storageId)) === '1'
  } catch {
    return false
  }
}

export function markPracticeCheckAutoShownThisSession(storageId: string): void {
  if (!storageId) return
  try {
    sessionStorage.setItem(autoShownSessionKey(storageId), '1')
  } catch {
    /* ignore */
  }
}

export function loadPracticeCheckState(
  storageId: string,
  fingerprint: string,
): SavedPracticeCheckState | null {
  if (!storageId || !fingerprint) return null
  try {
    const raw = localStorage.getItem(stateKey(storageId, fingerprint))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedPracticeCheckState> & { launchCount?: number } | null
    if (!parsed) return null
    return {
      snoozeUntil: Number.isFinite(parsed.snoozeUntil) ? Number(parsed.snoozeUntil) : 0,
      updatedAt: Number.isFinite(parsed.updatedAt) ? Number(parsed.updatedAt) : 0,
    }
  } catch {
    return null
  }
}

export function savePracticeCheckState(
  storageId: string,
  fingerprint: string,
  state: SavedPracticeCheckState,
): void {
  if (!storageId || !fingerprint) return
  try {
    localStorage.setItem(stateKey(storageId, fingerprint), JSON.stringify(state))
  } catch {
    // ignore quota and private mode failures
  }
}
