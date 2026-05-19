import type { BbsPromotionSlot } from '../../api/streetPathWithBbs'
import { bbsLevelShowsMonthlyPlanPurchaserReminder, type BbsLevelKey } from '../../constants/bbsOffers'
import en from '../../locales/en.json'
import BbsBeltLogo from './BbsBeltLogo'

function InfoCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.4" className="opacity-85" />
      <path
        d="M10 9v5M10 6.5v.01"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface BbsOfferDrawerPanelProps {
  bbs: BbsPromotionSlot
  compact: boolean
  closeDrawer: () => void
  levelDeclaredMastered: boolean
  onDeclareMastered: (level: BbsLevelKey) => void
  onContinuePath: () => void
}

export default function BbsOfferDrawerPanel({
  bbs,
  compact,
  closeDrawer,
  levelDeclaredMastered,
  onDeclareMastered,
  onContinuePath,
}: BbsOfferDrawerPanelProps) {
  const mastered = levelDeclaredMastered
  const curriculum = bbs.curriculumAccessUrl
  const showOneTimeMonthlyReminder =
    Boolean(bbs.oneTimeCheckoutUrl) && bbsLevelShowsMonthlyPlanPurchaserReminder(bbs.sequenceLevel)

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain ${compact ? 'px-5 pb-8 pt-2' : 'px-6 pb-10 pt-4'}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <BbsBeltLogo size={44} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gatame-gold/90">
              Black Belt System
            </p>
            <h3 className="mt-1 text-lg font-bold leading-tight text-white">{bbs.titleEn}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">{bbs.subtextEn}</p>

      <div className="mt-6 space-y-3">
        {curriculum ? (
          <a
            href={curriculum}
            target="_blank"
            rel="noreferrer"
            className="flex w-full items-center justify-center rounded-xl bg-gatame-gold py-3 text-sm font-bold uppercase tracking-wide text-gatame-navy hover:brightness-110"
          >
            Access Curriculum
          </a>
        ) : (
          <p className="text-xs text-slate-500">Curriculum link is not available for this level yet.</p>
        )}

        <button
          type="button"
          disabled={mastered}
          onClick={() => {
            if (!mastered) onDeclareMastered(bbs.sequenceLevel)
          }}
          className={`w-full rounded-xl border py-3 text-sm font-bold uppercase tracking-wide transition-colors ${
            mastered
              ? 'cursor-default border-emerald-600/50 bg-emerald-950/40 text-emerald-300'
              : 'cursor-pointer border-emerald-500/50 bg-emerald-950/60 text-emerald-50 hover:bg-emerald-900/70'
          }`}
        >
          {mastered ? 'Level recorded' : "I've Mastered This Level"}
        </button>

        <button
          type="button"
          onClick={() => {
            onContinuePath()
            closeDrawer()
          }}
          className="w-full py-2 text-center text-xs font-semibold uppercase tracking-wide text-white/45 underline-offset-2 hover:text-white/80"
        >
          Next technique — continue path
        </button>
      </div>

      <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Purchase options</p>

        {bbs.monthlyCheckoutUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-gatame-gold/45 bg-gatame-gold/10 p-4">
            <span className="absolute right-3 top-3 rounded-full bg-gatame-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gatame-navy">
              Recommended
            </span>
            <p className="text-sm font-bold text-white">Monthly Plan</p>
            <p className="mt-1 text-xs text-white/60">Flexible access billed monthly.</p>
            <a
              href={bbs.monthlyCheckoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gatame-gold py-2.5 text-sm font-bold text-gatame-navy hover:brightness-110"
            >
              Open Monthly checkout
            </a>
          </div>
        ) : null}

        {bbs.oneTimeCheckoutUrl ? (
          <div className="rounded-xl border border-blue-950/80 bg-blue-950/55 p-4 shadow-inner shadow-black/20">
            <p className="text-sm font-bold text-blue-50">One-time Plan</p>
            <p className="mt-1 text-xs text-blue-200/65">Single purchase for this rank program.</p>
            {showOneTimeMonthlyReminder ? (
              <div
                className="mt-3 flex gap-2.5 rounded-lg border border-sky-500/35 bg-sky-950/50 px-3 py-2.5"
                role="note"
              >
                <InfoCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-sky-300/95" />
                <div className="min-w-0 text-left">
                  <p className="text-[11px] font-semibold leading-snug text-sky-100">
                    {en.bbsReminderTitle}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-sky-200/85">{en.bbsReminderText}</p>
                </div>
              </div>
            ) : null}
            <a
              href={bbs.oneTimeCheckoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-blue-900/90 bg-blue-950 py-2.5 text-sm font-semibold text-blue-100 hover:border-blue-800 hover:bg-blue-900"
            >
              Open One-time checkout
            </a>
          </div>
        ) : null}
      </div>
    </div>
  )
}
