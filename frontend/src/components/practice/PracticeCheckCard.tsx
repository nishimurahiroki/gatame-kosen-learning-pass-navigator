import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { PracticeCheckStatus, PracticeTechniqueTarget } from '../../hooks/usePracticeCheck'
import { todaysFocusBadgeClass } from '../../constants/brandTheme'

const itWorkedButtonClass =
  'rounded-xl border border-emerald-400/50 bg-emerald-500/20 font-bold text-emerald-100 transition-colors hover:bg-emerald-500/30 active:scale-[0.98]'
import en from '../../locales/en.json'
import BbsBeltLogo from '../skillmap/BbsBeltLogo'

type PracticeCheckCardProps = {
  open: boolean
  target: PracticeTechniqueTarget | null
  status: PracticeCheckStatus
  educationMessage: string
  bbsUrl: string | null
  undoUntil: number
  onCloseNotNow: () => void
  onBackToFocus: () => void
  onSuccess: () => void
  onNotWorking: () => void
  onUndo: () => void
}

export default function PracticeCheckCard({
  open,
  target,
  status,
  educationMessage,
  bbsUrl,
  undoUntil,
  onCloseNotNow,
  onBackToFocus,
  onSuccess,
  onNotWorking,
  onUndo,
}: PracticeCheckCardProps) {
  const undoSeconds = useMemo(() => Math.max(0, Math.ceil((undoUntil - Date.now()) / 1000)), [undoUntil])

  if (!open || !target) return null

  const isPromo = status === 'bbsPromo'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-4 py-6 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby={isPromo ? 'stuck-headline' : 'todays-focus-label todays-focus-title'}
          className="w-full max-w-xl rounded-2xl border border-gatame-gold/55 bg-slate-950/95 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.6)] ring-1 ring-gatame-gold/25"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isPromo ? (
              <motion.div
                key="bbs-promo"
                className="text-left"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3">
                  <BbsBeltLogo size={36} className="shrink-0" />
                  <h3 id="stuck-headline" className="text-xl font-semibold leading-snug tracking-tight text-white sm:text-[1.35rem]">
                    {en.todaysFocus.stuckHeadline}
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-white/82">
                  {en.todaysFocus.bbsFeedbackSubLead}
                  <span className="font-semibold text-gatame-goldHi">{en.todaysFocus.bbsFeedbackSubEmphasis}</span>
                  {en.todaysFocus.bbsFeedbackSubTail}
                </p>

                <p className="mt-5 border-l-2 border-gatame-gold/35 pl-3 text-sm leading-relaxed text-white/85">
                  {educationMessage}
                </p>

                {bbsUrl ? (
                  <a
                    href={bbsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${itWorkedButtonClass} mt-6 flex w-full items-center justify-center px-6 py-3.5 text-[15px] no-underline`}
                  >
                    {en.todaysFocus.getBlackBeltSystemCta}
                  </a>
                ) : (
                  <p className="mt-6 text-left text-xs text-white/40">{en.bbsGate.checkoutUnavailable}</p>
                )}

                <div className="mt-5 flex gap-6 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={onBackToFocus}
                    className="text-sm font-medium text-[#2997ff] transition-opacity hover:opacity-80"
                  >
                    {en.todaysFocus.back}
                  </button>
                  <button
                    type="button"
                    onClick={onCloseNotNow}
                    className="text-sm font-medium text-[#2997ff] transition-opacity hover:opacity-80"
                  >
                    {en.todaysFocus.close}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <p id="todays-focus-label" className={todaysFocusBadgeClass}>
                  {en.todaysFocus.label}
                </p>
                <h3 id="todays-focus-title" className="mt-4 text-xl font-bold leading-tight sm:text-2xl">
                  {target.techniqueName}
                </h3>
                <p className="mt-1 text-sm text-white/70">{target.moduleName}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/75">{en.todaysFocus.subcopy}</p>

                <ul className="mt-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                  {target.focusPoints.map((point) => (
                    <li key={point} className="leading-relaxed text-white/90">
                      - {point}
                    </li>
                  ))}
                </ul>

                {undoSeconds > 0 ? (
                  <div className="mt-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm">
                    <p className="font-semibold text-emerald-200">{en.todaysFocus.markedComplete}</p>
                    <button
                      type="button"
                      onClick={onUndo}
                      className="mt-2 rounded-lg border border-emerald-300/45 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-100 hover:bg-emerald-500/30"
                    >
                      {en.todaysFocus.undo} ({undoSeconds}s)
                    </button>
                  </div>
                ) : null}

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={onSuccess}
                    className={`${itWorkedButtonClass} px-3 py-2 text-sm`}
                  >
                    {en.todaysFocus.itWorked}
                  </button>
                  <button
                    type="button"
                    onClick={onNotWorking}
                    className="rounded-xl border border-amber-400/45 bg-amber-500/15 px-3 py-2 text-sm font-bold text-amber-100 hover:bg-amber-500/25"
                  >
                    {en.todaysFocus.notWorking}
                  </button>
                  <button
                    type="button"
                    onClick={onCloseNotNow}
                    className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm font-bold text-white/90 hover:bg-white/10"
                  >
                    {en.todaysFocus.notNow}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </motion.div>
    </AnimatePresence>
  )
}
