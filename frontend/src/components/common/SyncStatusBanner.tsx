import { useSync } from '../../context/SyncContext'
import en from '../../locales/en.json'

/**
 * 画面上部に固定表示するクラウド同期ステータス。
 * 未送信がある・失敗した・オフラインのときだけ目立つ表示になる。
 */
export default function SyncStatusBanner() {
  const { status, pendingCount, lastError, retryNow, discardUnsaved } = useSync()

  if (status === 'synced') return null

  const copy = en.sync.banner[status]
  const showRetry = status === 'error' || status === 'offline' || status === 'pending'

  const toneClass =
    status === 'syncing'
      ? 'border-sky-500/40 bg-sky-950/90 text-sky-100'
      : status === 'offline'
        ? 'border-amber-500/40 bg-amber-950/90 text-amber-100'
        : 'border-rose-500/40 bg-rose-950/90 text-rose-100'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[100] border-b px-4 py-2.5 text-center text-sm shadow-lg backdrop-blur-sm ${toneClass}`}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <span>
          {copy}
          {pendingCount > 0 && status !== 'syncing'
            ? ` (${en.sync.pendingCount.replace('{n}', String(pendingCount))})`
            : null}
        </span>
        {showRetry ? (
          <button
            type="button"
            onClick={retryNow}
            className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide hover:bg-white/20"
          >
            {en.sync.retry}
          </button>
        ) : null}
        {status === 'error' ? (
          <button
            type="button"
            onClick={discardUnsaved}
            className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
          >
            {en.sync.dismiss}
          </button>
        ) : null}
      </div>
      {lastError && status === 'error' ? (
        <p className="mx-auto mt-1 max-w-2xl text-[11px] leading-snug opacity-90">
          {en.sync.errorDetail}: {lastError}
        </p>
      ) : null}
    </div>
  )
}
