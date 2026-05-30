import { AnimatePresence, motion } from 'framer-motion'
import { ghostGoldCtaClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'

export interface PathStageCompleteOverlayProps {
  open: boolean
  canGenerateNext: boolean
  generating: boolean
  onGenerateNext: () => void
  onRetakeAssessment: () => void
  onDismiss: () => void
}

export default function PathStageCompleteOverlay({
  open,
  canGenerateNext,
  generating,
  onGenerateNext,
  onRetakeAssessment,
  onDismiss,
}: PathStageCompleteOverlayProps) {
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
          aria-labelledby="path-stage-complete-title"
        >
          <motion.div
            className="relative mx-auto max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-gatame-gold/45 bg-gatame-midnight px-6 py-7 text-white shadow-[0_28px_96px_rgba(0,0,0,0.72)] sm:px-8 sm:py-9"
            style={{ fontFamily: 'Urbanist, system-ui, Segoe UI, sans-serif' }}
            initial={{ scale: 0.94, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          >
            <div className="mb-3 inline-flex rounded-full border border-gatame-gold/60 px-3 py-1 text-[13px] font-bold uppercase tracking-[0.22em] text-gatame-gold">
              {en.pathStageComplete.badge}
            </div>
            <h2
              id="path-stage-complete-title"
              className="text-xl font-black leading-tight tracking-tight text-gatame-gold sm:text-2xl"
            >
              {en.pathStageComplete.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/85 sm:text-[15px]">
              {canGenerateNext
                ? en.pathStageComplete.description
                : en.pathStageComplete.descriptionExhausted}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {canGenerateNext ? (
                <button
                  type="button"
                  onClick={onGenerateNext}
                  disabled={generating}
                  className={`${ghostGoldCtaClass} w-full py-4 text-sm disabled:cursor-wait disabled:opacity-70`}
                >
                  {generating ? en.pathStageComplete.generating : en.pathStageComplete.generateNext}
                </button>
              ) : null}
              <button
                type="button"
                onClick={onRetakeAssessment}
                disabled={generating}
                className="w-full rounded-2xl border border-white/25 bg-transparent px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/85 transition-colors hover:border-white/45 hover:bg-white/[0.04] disabled:opacity-50"
              >
                {en.pathStageComplete.retakeAssessment}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                disabled={generating}
                className="w-full rounded-2xl border border-transparent px-5 py-2 text-center text-xs font-medium text-white/55 transition-colors hover:text-white/75 disabled:opacity-50"
              >
                {en.pathStageComplete.notNow}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
