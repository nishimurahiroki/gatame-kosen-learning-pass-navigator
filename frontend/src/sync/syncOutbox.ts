import type { SyncOp, SyncOutboxEntry } from './syncTypes'

const OUTBOX_PREFIX = 'gatame.sync-outbox.v1:'

function storageKey(userId: string): string {
  return OUTBOX_PREFIX + userId
}

export function syncOpKey(op: SyncOp): string {
  switch (op.kind) {
    case 'learning_path':
      return 'learning_path'
    case 'clear_learning_path':
      return 'clear_learning_path'
    case 'module_progress':
      return `module_progress:${op.fingerprint}`
    case 'module_detail':
      return `module_detail:${op.sessionKey}:${op.moduleId}`
  }
}

export function loadOutbox(userId: string): SyncOutboxEntry[] {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isSyncOutboxEntry)
  } catch {
    return []
  }
}

function isSyncOutboxEntry(value: unknown): value is SyncOutboxEntry {
  if (!value || typeof value !== 'object') return false
  const e = value as SyncOutboxEntry
  return typeof e.key === 'string' && typeof e.updatedAt === 'number' && e.op != null
}

function saveOutbox(userId: string, entries: SyncOutboxEntry[]): void {
  try {
    if (entries.length === 0) {
      localStorage.removeItem(storageKey(userId))
    } else {
      localStorage.setItem(storageKey(userId), JSON.stringify(entries))
    }
  } catch {
    /* ストレージ満杯等 */
  }
}

/** 同一キーの未送信操作は最新で置き換え */
export function enqueueOutbox(userId: string, op: SyncOp): void {
  if (!userId) return
  const key = syncOpKey(op)
  const next: SyncOutboxEntry = { key, op, updatedAt: Date.now() }
  const cur = loadOutbox(userId).filter((e) => e.key !== key)
  cur.push(next)
  cur.sort((a, b) => a.updatedAt - b.updatedAt)
  saveOutbox(userId, cur)
}

export function removeOutboxKey(userId: string, key: string): void {
  const cur = loadOutbox(userId).filter((e) => e.key !== key)
  saveOutbox(userId, cur)
}

export function clearOutbox(userId: string): void {
  if (!userId) return
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    /* ignore */
  }
}

export function outboxCount(userId: string): number {
  return loadOutbox(userId).length
}
