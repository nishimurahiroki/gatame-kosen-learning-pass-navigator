import { AnimatePresence, motion } from 'framer-motion'
import type { BbsLevelKey } from '../../constants/bbsOffers'
import { ghostGoldCtaClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'
import BbsLevelCircleImage from './BbsLevelCircleImage'

export interface PathBbsChallengePromoOverlayProps {
  open: boolean
  bbsLevel?: BbsLevelKey
  onExploreBbs: () => void
  onDismiss: () => void
}

export default function PathBbsChallengePromoOverlay({
  open,
  bbsLevel,
  onExploreBbs,
  onDismiss,
}: PathBbsChallengePromoOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[165] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bbs-challenge-promo-title"
        >
          <motion.div
            className="relative mx-auto max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-gatame-gold/45 bg-gatame-midnight px-6 py-7 text-white shadow-[0_28px_96px_rgba(0,0,0,0.72)] sm:px-8 sm:py-9"
            style={{ fontFamily: 'Urbanist, system-ui, Segoe UI, sans-serif' }}
            initial={{ scale: 0.94, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          >
            <div className="mb-4 flex items-start gap-4">
              {bbsLevel ? (
                <BbsLevelCircleImage level={bbsLevel} size={52} className="shrink-0" alt="" />
              ) : null}
              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-gatame-gold/60 px-3 py-1 text-[13px] font-bold uppercase tracking-[0.22em] text-gatame-gold">
                  {en.bbsChallengePromo.badge}
                </div>
                <h2
                  id="bbs-challenge-promo-title"
                  className="mt-2 text-xl font-black leading-tight tracking-tight text-gatame-gold sm:text-2xl"
                >
                  {en.bbsChallengePromo.title}
                </h2>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/85 sm:text-[15px]">
              {en.bbsChallengePromo.description}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={onExploreBbs}
                className={`${ghostGoldCtaClass} w-full py-4 text-sm`}
              >
                {en.bbsChallengePromo.cta}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="w-full rounded-2xl border border-transparent px-5 py-2 text-center text-xs font-medium text-white/55 transition-colors hover:text-white/75"
              >
                {en.bbsChallengePromo.notNow}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
