import { useEffect, useState } from 'react'
import type { SyncProfileStatus } from '../../context/SyncContext'
import { useSync } from '../../context/SyncContext'
import { ghostGoldCtaSubtleClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'
import { formatLastSaved } from '../../utils/formatLastSaved'

const STATUS_DOT: Record<SyncProfileStatus, string> = {
  synced: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]',
  pending: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
  syncing: 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.45)]',
  error: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.45)]',
  offline: 'bg-white/35',
}

export default function ProfileSyncStatus() {
  const {
    profileStatus,
    pendingCount,
    lastError,
    lastSyncedAt,
    retryNow,
    discardUnsaved,
  } = useSync()

  const [, tick] = useState(0)
  useEffect(() => {
    if (!lastSyncedAt) return
    const id = window.setInterval(() => tick((n) => n + 1), 60_000)
    return () => window.clearInterval(id)
  }, [lastSyncedAt])

  const headline = en.sync.profile[profileStatus]
  const showActions = profileStatus !== 'synced' && profileStatus !== 'syncing'
  const showLastSaved = profileStatus === 'synced' && lastSyncedAt != null

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#060b14]/80 px-5 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/38">
        {en.sync.profile.heading}
      </p>

      <div className="mt-3 flex items-start gap-3">
        <span
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[profileStatus]}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium leading-snug text-white/90">{headline}</p>
          {pendingCount > 0 && profileStatus !== 'synced' ? (
            <p className="mt-1 text-xs text-white/50">
              {en.sync.profile.pendingItems.replace('{n}', String(pendingCount))}
            </p>
          ) : null}
          {showLastSaved ? (
            <p className="mt-1 text-xs text-white/50">{formatLastSaved(lastSyncedAt)}</p>
          ) : null}
          {lastError && profileStatus === 'error' ? (
            <p className="mt-2 text-xs leading-relaxed text-rose-200/85">
              {en.sync.errorDetail}: {lastError}
            </p>
          ) : null}
        </div>
      </div>

      {showActions ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={retryNow}
            className={`${ghostGoldCtaSubtleClass} px-5 py-2 text-[10px]`}
          >
            {en.sync.profile.syncNow}
          </button>
          {profileStatus === 'error' ? (
            <button
              type="button"
              onClick={discardUnsaved}
              className="rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white/70"
            >
              {en.sync.profile.discardUnsaved}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
