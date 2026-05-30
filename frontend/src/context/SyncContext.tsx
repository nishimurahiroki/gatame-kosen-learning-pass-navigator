import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import en from '../locales/en.json'
import { SYNC_BANNER_PENDING_DEBOUNCE_MS } from '../sync/syncConstants'
import {
  clearUserSyncQueue,
  flushSyncQueueImmediate,
  getPendingSyncCount,
  isBrowserOnline,
} from '../sync/syncService'
import { GATAME_SYNC_CHANGED_EVENT } from '../sync/syncTypes'

/** バナーに出す状態（syncing は UI に出さない） */
export type SyncBannerDisplayStatus = 'pending' | 'error' | 'offline'

/** Profile 同期ステータス */
export type SyncProfileStatus = 'synced' | 'pending' | 'syncing' | 'error' | 'offline'

type DerivedBannerStatus = 'synced' | SyncBannerDisplayStatus

function deriveProfileStatus(
  online: boolean,
  pendingCount: number,
  lastFlushHadFailures: boolean,
  isFlushing: boolean,
): SyncProfileStatus {
  if (!online) return 'offline'
  if (isFlushing) return 'syncing'
  if (pendingCount > 0) return lastFlushHadFailures ? 'error' : 'pending'
  return 'synced'
}

type SyncContextValue = {
  /** 画面上部オーバーレイバナーを表示するか */
  showBanner: boolean
  bannerStatus: SyncBannerDisplayStatus
  pendingCount: number
  lastError: string | null
  retryNow: () => void
  /** 未送信キューを破棄しバナーを閉じる（ローカル進捗は残る） */
  discardUnsaved: () => void
  isOnline: boolean
  profileStatus: SyncProfileStatus
  lastSyncedAt: number | null
}

const SyncContext = createContext<SyncContextValue | null>(null)

function deriveBannerStatus(
  online: boolean,
  pendingCount: number,
  lastFlushHadFailures: boolean,
): DerivedBannerStatus {
  if (!online) return 'offline'
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
  const [lastFlushHadFailures, setLastFlushHadFailures] = useState(false)
  const [lastError, setLastError] = useState<string | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isFlushing, setIsFlushing] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)

  const rawBannerStatus = deriveBannerStatus(online, pendingCount, lastFlushHadFailures)

  const refreshPending = useCallback(() => {
    setPendingCount(getPendingSyncCount(userId))
  }, [userId])

  const runFlush = useCallback(async () => {
    if (!userId) {
      refreshPending()
      return
    }
    if (!isBrowserOnline()) {
      refreshPending()
      return
    }
    setIsFlushing(true)
    try {
      const result = await flushSyncQueueImmediate(userId)
      const remaining = result.remaining
      if (result.authStale) {
        setLastFlushHadFailures(false)
        setLastError(en.sync.authStale)
        return
      }
      setLastFlushHadFailures(result.failed > 0 && remaining > 0)
      setLastError(remaining > 0 ? result.lastError : null)
      if (remaining === 0) {
        setLastSyncedAt(Date.now())
      }
    } finally {
      setIsFlushing(false)
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

  // 案1: 成功中は黙る。offline/error は即表示、pending は一定時間続いたときだけ
  useEffect(() => {
    if (rawBannerStatus === 'synced') {
      setShowBanner(false)
      return
    }
    if (rawBannerStatus === 'offline' || rawBannerStatus === 'error') {
      setShowBanner(true)
      return
    }
    const timer = window.setTimeout(() => {
      setShowBanner(true)
    }, SYNC_BANNER_PENDING_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [rawBannerStatus, pendingCount])

  // 起動時・userId 確定時: 未送信を先にアップロード
  useEffect(() => {
    if (!userId) {
      setPendingCount(0)
      setLastFlushHadFailures(false)
      setLastError(null)
      setShowBanner(false)
      setIsFlushing(false)
      setLastSyncedAt(null)
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

  const bannerStatus: SyncBannerDisplayStatus =
    rawBannerStatus === 'synced' ? 'pending' : rawBannerStatus

  const profileStatus = deriveProfileStatus(online, pendingCount, lastFlushHadFailures, isFlushing)

  const value = useMemo(
    () => ({
      showBanner,
      bannerStatus,
      pendingCount,
      lastError,
      retryNow,
      discardUnsaved,
      isOnline: online,
      profileStatus,
      lastSyncedAt,
    }),
    [
      showBanner,
      bannerStatus,
      pendingCount,
      lastError,
      retryNow,
      discardUnsaved,
      online,
      profileStatus,
      lastSyncedAt,
    ],
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
