import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearUserSyncQueue,
  flushSyncQueue,
  getPendingSyncCount,
  isBrowserOnline,
} from '../sync/syncService'
import { GATAME_SYNC_CHANGED_EVENT, type SyncBannerStatus } from '../sync/syncTypes'

type SyncContextValue = {
  status: SyncBannerStatus
  pendingCount: number
  lastError: string | null
  retryNow: () => void
  /** 未送信キューを破棄しバナーを閉じる（ローカル進捗は残る） */
  discardUnsaved: () => void
}

const SyncContext = createContext<SyncContextValue | null>(null)

function deriveStatus(
  online: boolean,
  pendingCount: number,
  syncing: boolean,
  lastFlushHadFailures: boolean,
): SyncBannerStatus {
  if (!online) return 'offline'
  if (syncing) return 'syncing'
  if (pendingCount > 0) return lastFlushHadFailures ? 'error' : 'pending'
  return 'synced'
}

export function SyncProvider({
  userId,
  children,
}: {
  userId: string | undefined
  children: ReactNode
}) {
  const [online, setOnline] = useState(() => isBrowserOnline())
  const [pendingCount, setPendingCount] = useState(() => getPendingSyncCount(userId))
  const [syncing, setSyncing] = useState(false)
  const [lastFlushHadFailures, setLastFlushHadFailures] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)

  const refreshPending = useCallback(() => {
    setPendingCount(getPendingSyncCount(userId))
  }, [userId])

  const runFlush = useCallback(async () => {
    if (!userId || !isBrowserOnline()) {
      refreshPending()
      return
    }
    setSyncing(true)
    try {
      const result = await flushSyncQueue(userId)
      const remaining = result.remaining
      setLastFlushHadFailures(result.failed > 0 && remaining > 0)
      setLastError(remaining > 0 ? result.lastError : null)
    } finally {
      setSyncing(false)
      refreshPending()
    }
  }, [userId, refreshPending])

  const retryNow = useCallback(() => {
    void runFlush()
  }, [runFlush])

  const discardUnsaved = useCallback(() => {
    if (!userId) return
    clearUserSyncQueue(userId)
    setLastFlushHadFailures(false)
    setLastError(null)
    refreshPending()
  }, [userId, refreshPending])

  // 起動時・userId 確定時: 未送信を先にアップロード
  useEffect(() => {
    if (!userId) {
      setPendingCount(0)
      setLastFlushHadFailures(false)
      setLastError(null)
      return
    }
    refreshPending()
    void runFlush()
  }, [userId, runFlush, refreshPending])

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      void runFlush()
    }
    const onOffline = () => setOnline(false)
    const onSyncChanged = () => refreshPending()

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener(GATAME_SYNC_CHANGED_EVENT, onSyncChanged)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener(GATAME_SYNC_CHANGED_EVENT, onSyncChanged)
    }
  }, [runFlush, refreshPending])

  const status = deriveStatus(online, pendingCount, syncing, lastFlushHadFailures)

  const value = useMemo(
    () => ({ status, pendingCount, lastError, retryNow, discardUnsaved }),
    [status, pendingCount, lastError, retryNow, discardUnsaved],
  )

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext)
  if (!ctx) {
    throw new Error('useSync must be used within SyncProvider')
  }
  return ctx
}
