import { useSync } from '../../context/SyncContext'
import en from '../../locales/en.json'

/**
 * 画面上部に固定オーバーレイ表示するクラウド同期ステータス。
 * 保存中（syncing）は出さない。pending は一定時間続いたときのみ。
 * レイアウトは押し下げない（案1 + オーバーレイ）。
 */
export default function SyncStatusBanner() {
  const { showBanner, bannerStatus, pendingCount, lastError, retryNow, discardUnsaved } = useSync()

  if (!showBanner) return null

  const copy = en.sync.banner[bannerStatus]
  const showRetry =
    bannerStatus === 'error' || bannerStatus === 'offline' || bannerStatus === 'pending'

  const toneClass =
    bannerStatus === 'offline'
      ? 'border-amber-500/40 bg-amber-950/90 text-amber-100'
      : 'border-rose-500/40 bg-rose-950/90 text-rose-100'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto fixed inset-x-0 top-0 z-[100] border-b px-4 py-2.5 text-center text-sm shadow-lg backdrop-blur-sm ${toneClass}`}
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
        <span>
          {copy}
          {pendingCount > 0
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
        {bannerStatus === 'error' ? (
          <button
            type="button"
            onClick={discardUnsaved}
            className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold hover:bg-white/20"
          >
            {en.sync.dismiss}
          </button>
        ) : null}
      </div>
      {lastError && bannerStatus === 'error' ? (
        <p className="mx-auto mt-1 max-w-2xl text-[11px] leading-snug opacity-90">
          {en.sync.errorDetail}: {lastError}
        </p>
      ) : null}
    </div>
  )
}
