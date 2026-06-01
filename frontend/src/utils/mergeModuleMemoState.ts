import type { RemoteModuleDetail } from '../api/supabaseProgressApi'
import { loadOutbox } from '../sync/syncOutbox'

export function getPendingModuleDetail(
  userId: string,
  sessionKey: string,
  moduleId: string,
): { detail: RemoteModuleDetail; updatedAt: number } | null {
  const entries = loadOutbox(userId)
  for (let i = entries.length - 1; i >= 0; i--) {
    const entry = entries[i]
    const op = entry.op
    if (
      op.kind === 'module_detail' &&
      op.sessionKey === sessionKey &&
      op.moduleId === moduleId
    ) {
      return { detail: op.detail, updatedAt: entry.updatedAt }
    }
  }
  return null
}

/** リモート取得結果とローカル／アウトボックスのどちらが新しいかで memo を決める */
export function resolveMergedModuleMemo(
  localMemo: string,
  remote: RemoteModuleDetail,
  pending: { detail: RemoteModuleDetail; updatedAt: number } | null,
): string {
  const remoteMemo = remote.memo ?? ''
  const remoteUpdated = remote.updatedAt ? Date.parse(remote.updatedAt) : 0
  const pendingUpdated = pending?.updatedAt ?? 0

  if (pending && (!remoteUpdated || pendingUpdated >= remoteUpdated)) {
    return pending.detail.memo ?? ''
  }
  if (remoteUpdated > 0) {
    return remoteMemo
  }
  return remoteMemo || localMemo
}
