import { saveRemoteModuleDetail, type RemoteModuleDetail } from '../api/supabaseProgressApi'
import { cancelScheduledSyncFlush } from '../sync/syncService'
import { removeOutboxKey, syncOpKey } from '../sync/syncOutbox'
import { notifyModuleMemoChanged } from './moduleMemoEvents'

export class ModuleMemoPersistError extends Error {
  constructor(message = 'MEMO_SYNC_FAILED') {
    super(message)
    this.name = 'ModuleMemoPersistError'
  }
}

export class GuestModulePersistError extends Error {
  constructor() {
    super('GUEST_MEMO')
    this.name = 'GuestModulePersistError'
  }
}

const userMemoSaveInFlight = new Map<string, Promise<void>>()
const checkedSyncTimers = new Map<string, number>()

const CHECKED_SYNC_DEBOUNCE_MS = 400

function inFlightKey(userId: string, sessionKey: string, moduleId: string): string {
  return `${userId}\u0000${sessionKey}\u0000${moduleId}`
}

function checkedSyncTimerKey(userId: string, sessionKey: string, moduleId: string): string {
  return `checked:${userId}\u0000${sessionKey}\u0000${moduleId}`
}

function clearLegacyModuleDetailOutbox(
  userId: string,
  sessionKey: string,
  moduleId: string,
): void {
  removeOutboxKey(
    userId,
    syncOpKey({
      kind: 'module_detail',
      sessionKey,
      moduleId,
      detail: { checkedItems: {}, memo: '' },
    }),
  )
}

async function saveModuleDetailDirect(
  userId: string,
  sessionKey: string,
  moduleId: string,
  detail: RemoteModuleDetail,
): Promise<void> {
  clearLegacyModuleDetailOutbox(userId, sessionKey, moduleId)
  const result = await saveRemoteModuleDetail(userId, sessionKey, moduleId, detail)
  if (!result.ok) {
    throw new ModuleMemoPersistError(result.message)
  }
}

/** TODO / 練習チェック: バックグラウンド保存（ユーザーのメモ Save をブロックしない） */
export function scheduleModuleDetailCheckedSync(
  userId: string,
  sessionKey: string,
  moduleId: string,
  getDetail: () => RemoteModuleDetail,
): void {
  const timerKey = checkedSyncTimerKey(userId, sessionKey, moduleId)
  const prev = checkedSyncTimers.get(timerKey)
  if (prev !== undefined) window.clearTimeout(prev)

  checkedSyncTimers.set(
    timerKey,
    window.setTimeout(() => {
      checkedSyncTimers.delete(timerKey)
      void (async () => {
        try {
          const detail = getDetail()
          await saveModuleDetailDirect(userId, sessionKey, moduleId, detail)
          notifyModuleMemoChanged({
            moduleId,
            memo: detail.memo,
            checkedItems: detail.checkedItems,
          })
        } catch {
          /* バックグラウンド同期失敗は Sync バナー側で検知 */
        }
      })()
    }, CHECKED_SYNC_DEBOUNCE_MS),
  )
}

export function cancelModuleDetailCheckedSync(
  userId: string,
  sessionKey: string,
  moduleId: string,
): void {
  const timerKey = checkedSyncTimerKey(userId, sessionKey, moduleId)
  const prev = checkedSyncTimers.get(timerKey)
  if (prev !== undefined) {
    window.clearTimeout(prev)
    checkedSyncTimers.delete(timerKey)
  }
}

/**
 * 明示的メモ保存（Profile / ドロワー Save 共通）。
 * detail をその場で受け取り、Supabase へ直接 upsert する。
 * 同期キュー全体の flush は待たない（Profile と同じ速さ）。
 */
export async function persistModuleMemo(
  userId: string,
  sessionKey: string,
  moduleId: string,
  detail: RemoteModuleDetail,
): Promise<void> {
  cancelModuleDetailCheckedSync(userId, sessionKey, moduleId)
  cancelScheduledSyncFlush(userId)

  const flightKey = inFlightKey(userId, sessionKey, moduleId)
  const prev = userMemoSaveInFlight.get(flightKey)
  if (prev) {
    await prev.catch(() => undefined)
  }

  const work = (async () => {
    await saveModuleDetailDirect(userId, sessionKey, moduleId, detail)
    notifyModuleMemoChanged({
      moduleId,
      memo: detail.memo,
      checkedItems: detail.checkedItems,
    })
  })()

  userMemoSaveInFlight.set(flightKey, work)
  try {
    await work
  } finally {
    if (userMemoSaveInFlight.get(flightKey) === work) {
      userMemoSaveInFlight.delete(flightKey)
    }
  }
}

export function readModuleDetailSlice(
  store: Record<string, { checked: Record<string, boolean>; memo: string }>,
  moduleId: string,
): RemoteModuleDetail {
  const cur = store[moduleId]
  return {
    checkedItems: cur?.checked ?? {},
    memo: cur?.memo ?? '',
  }
}
