import type { BbsPromotionSlot } from '../../api/streetPathWithBbs'
import { getBbsLevelCardBackgroundSrc } from '../../constants/bbsAssets'
import { bbsLevelShowsMonthlyPlanPurchaserReminder } from '../../constants/bbsOffers'
import en from '../../locales/en.json'
import BbsLevelCircleImage from './BbsLevelCircleImage'

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
}

export default function BbsOfferDrawerPanel({
  bbs,
  compact,
  closeDrawer,
}: BbsOfferDrawerPanelProps) {
  const isGate = bbs.isConversionGate
  const showOneTimeMonthlyReminder =
    Boolean(bbs.oneTimeCheckoutUrl) && bbsLevelShowsMonthlyPlanPurchaserReminder(bbs.sequenceLevel)
  const levelBannerSrc = getBbsLevelCardBackgroundSrc(bbs.urlLevel)

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain ${
        compact
          ? 'px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]'
          : 'px-6 pb-10 pt-4'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <BbsLevelCircleImage level={bbs.urlLevel} size={44} className="shrink-0" alt="" />
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight text-white">{bbs.titleEn}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/10 hover:text-white"
        >
          {en.common.close}
        </button>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">
        {isGate ? en.bbsGate.offerIntro : bbs.subtextEn}
      </p>

      <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
        {levelBannerSrc ? (
          <div className="overflow-hidden rounded-xl border border-gatame-gold/30">
            <img
              src={levelBannerSrc}
              alt=""
              className="aspect-[16/10] w-full object-cover object-center"
              draggable={false}
              loading="lazy"
            />
          </div>
        ) : null}

        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {en.bbsGate.purchaseHeading}
        </p>

        {bbs.monthlyCheckoutUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-gatame-gold/45 bg-gatame-gold/10 p-4">
            <span className="absolute right-3 top-3 rounded-full bg-gatame-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gatame-navy">
              {en.recommendationRank.recommended}
            </span>
            <p className="text-sm font-bold text-white">{en.bbsGate.monthlyTitle}</p>
            <a
              href={bbs.monthlyCheckoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-gatame-gold py-2.5 text-sm font-bold text-gatame-navy hover:brightness-110"
            >
              {en.bbsGate.monthlyCta}
            </a>
          </div>
        ) : null}

        {bbs.oneTimeCheckoutUrl ? (
          <div className="rounded-xl border border-blue-950/80 bg-blue-950/55 p-4 shadow-inner shadow-black/20">
            <p className="text-sm font-bold text-blue-50">{en.bbsGate.oneTimeTitle}</p>
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
              {en.bbsGate.oneTimeCta}
            </a>
          </div>
        ) : null}

        {!bbs.monthlyCheckoutUrl && !bbs.oneTimeCheckoutUrl ? (
          <p className="text-xs text-slate-500">{en.bbsGate.checkoutUnavailable}</p>
        ) : null}
      </div>
    </div>
  )
}
