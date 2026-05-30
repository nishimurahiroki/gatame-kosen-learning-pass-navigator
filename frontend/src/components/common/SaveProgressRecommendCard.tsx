import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { saveProgressCtaClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'

type SaveProgressRecommendCardProps = {
  open: boolean
  message: string
  onSave: () => void
  onDismiss: () => void
}

/** Guest 向け Save progress 推薦（初回ドロワー / 初回 TODO）— body 直下で最前面表示 */
export default function SaveProgressRecommendCard({
  open,
  message,
  onSave,
  onDismiss,
}: SaveProgressRecommendCardProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onDismiss])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={en.top.saveProgressPromptNotNow}
            className="fixed inset-0 z-[210] bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onDismiss}
          />
          <div className="pointer-events-none fixed inset-0 z-[215] flex items-center justify-center px-4 py-6">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-progress-recommend-title"
              className="pointer-events-auto w-full max-w-md rounded-2xl border border-emerald-400/40 bg-slate-950/98 p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,0.72)]"
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
                {en.top.syncBannerTitle}
              </p>
              <h2
                id="save-progress-recommend-title"
                className="mt-2 text-lg font-bold leading-snug text-white sm:text-xl"
              >
                {en.top.saveProgressPromptTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/80">{message}</p>

              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onDismiss}
                  className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
                >
                  {en.top.saveProgressPromptNotNow}
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className={`${saveProgressCtaClass} sm:min-w-[10rem]`}
                >
                  {en.top.syncBannerCta}
                </button>
              </div>
            </motion.section>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
