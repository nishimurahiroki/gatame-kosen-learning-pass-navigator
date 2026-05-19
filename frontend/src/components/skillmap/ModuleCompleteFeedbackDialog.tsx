import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DifficultyFeedbackApi } from '../../api/progressApi'
import en from '../../locales/en.json'

export interface ModuleCompleteFeedbackDialogProps {
  open: boolean
  moduleName: string
  onClose: () => void
  onSubmit: (payload: {
    difficulty: DifficultyFeedbackApi
    satisfaction: number
    videoRequestNote?: string
  }) => Promise<void>
}

export default function ModuleCompleteFeedbackDialog({
  open,
  moduleName,
  onClose,
  onSubmit,
}: ModuleCompleteFeedbackDialogProps) {
  const [difficulty, setDifficulty] = useState<DifficultyFeedbackApi | null>(null)
  const [satisfaction, setSatisfaction] = useState<number | null>(null)
  const [videoNote, setVideoNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setDifficulty(null)
    setSatisfaction(null)
    setVideoNote('')
    setError(null)
    setSubmitting(false)
  }, [open])

  const canSubmit = useMemo(() => difficulty !== null && satisfaction !== null, [difficulty, satisfaction])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !difficulty || satisfaction === null) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        difficulty,
        satisfaction,
        videoRequestNote: videoNote.trim() || undefined,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : en.errors.feedbackSendFailed)
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, difficulty, onSubmit, satisfaction, videoNote])

  if (typeof document === 'undefined') return null

  const moduleLine = en.feedback.moduleLine.replace('{name}', moduleName)

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={en.feedback.closeOverlay}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => (!submitting ? onClose() : undefined)}
          />
          <div className="pointer-events-none fixed inset-0 z-[130] flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="feedback-title"
              className="pointer-events-auto w-[min(92vw,440px)] rounded-2xl border border-yellow-600/35 bg-slate-900 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              <h2 id="feedback-title" className="text-lg font-bold text-slate-200">
                {en.feedback.title}
              </h2>
              <p className="mt-1 text-sm text-slate-400">{moduleLine}</p>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{en.feedback.q1}</p>
                  <div className="mt-2 grid gap-2">
                    {(
                      [
                        ['TOO_EASY' as const, en.feedback.difficultyTooEasy],
                        ['JUST_RIGHT' as const, en.feedback.difficultyJustRight],
                        ['TOO_HARD' as const, en.feedback.difficultyTooHard],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        disabled={submitting}
                        onClick={() => setDifficulty(id)}
                        className={`rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                          difficulty === id
                            ? 'border-yellow-600 bg-yellow-600/15 text-yellow-200'
                            : 'border-slate-600/80 bg-slate-950/60 text-slate-300 hover:border-yellow-600/50'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-200">{en.feedback.q2}</p>
                  <div className="mt-2 flex gap-1" role="group" aria-label={en.feedback.q2}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        disabled={submitting}
                        aria-label={en.feedback.starAria.replace('{n}', String(n))}
                        onClick={() => setSatisfaction(n)}
                        className={`rounded-lg px-2 py-1 text-2xl leading-none transition-transform ${
                          satisfaction !== null && n <= satisfaction
                            ? 'scale-105 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.45)]'
                            : 'text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{en.feedback.satisfactionHint}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-200" htmlFor="video-request">
                    {en.feedback.q3}
                  </label>
                  <textarea
                    id="video-request"
                    rows={4}
                    disabled={submitting}
                    value={videoNote}
                    onChange={(e) => setVideoNote(e.target.value)}
                    placeholder={en.feedback.q3Placeholder}
                    className="mt-2 w-full resize-y rounded-xl border border-slate-600/80 bg-slate-950/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-yellow-600 focus:outline-none focus:ring-1 focus:ring-yellow-600/40"
                  />
                </div>
              </div>

              {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-slate-600 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800/80"
                >
                  {en.feedback.cancel}
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || submitting}
                  onClick={() => void handleSubmit()}
                  className="flex-1 rounded-xl bg-yellow-600 py-2.5 text-sm font-bold text-slate-950 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? en.feedback.submitting : en.feedback.submit}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
