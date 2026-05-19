import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import BbsBeltLogo from './BbsBeltLogo'

export interface LearningPathCompleteOverlayProps {
  open: boolean
  /** カタログ上のモジュールをすべて生涯習得済み（復習パス） */
  fullCatalogMastered: boolean
  masteryPercent: number
  /** BBS 合格宣言の進捗（例: 10 級中 3 級） */
  bbsRankMastery?: { completed: number; total: number } | null
  nextStageLoading: boolean
  canStartNext: boolean
  onStartNextStage: () => void | Promise<void>
}

function ConfettiLayer({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    const colors = ['#c5a059', '#e2e8f0', '#38bdf8', '#34d399', '#f472b6']
    return Array.from({ length: 28 }, (_, i) => {
      const left = ((seed * 13 + i * 37) % 1000) / 10
      const delay = (i % 8) * 0.04
      const duration = 2.2 + (i % 5) * 0.15
      const rot = ((seed + i * 41) % 720) - 360
      return { left, delay, duration, rot, color: colors[i % colors.length] }
    })
  }, [seed])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-3 w-2 rounded-sm opacity-90"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            rotate: p.rot,
          }}
          initial={{ y: '-10%', opacity: 0 }}
          animate={{
            y: ['-5%', '105vh'],
            opacity: [0, 1, 0.85, 0],
            rotate: [p.rot, p.rot + 240],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
            repeat: 0,
          }}
        />
      ))}
    </div>
  )
}

export default function LearningPathCompleteOverlay({
  open,
  fullCatalogMastered,
  masteryPercent,
  bbsRankMastery,
  nextStageLoading,
  canStartNext,
  onStartNextStage,
}: LearningPathCompleteOverlayProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="path-complete-title"
        >
          <ConfettiLayer seed={42} />
          <motion.div
            className="relative z-10 mx-auto max-w-lg rounded-2xl border border-gatame-gold/40 bg-slate-950/95 px-6 py-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            initial={{ scale: 0.92, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          >
            <div className="mb-2 inline-flex rounded-full border border-gatame-gold/50 bg-gatame-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gatame-gold">
              Achievement
            </div>
            <h2
              id="path-complete-title"
              className="text-2xl font-black tracking-tight text-white sm:text-3xl"
            >
              Learning Path Completed!!
            </h2>
            <p className="mt-3 text-sm text-white/70">
              Total Mastery:{' '}
              <span className="font-bold text-gatame-gold">{masteryPercent}%</span>
            </p>
            {bbsRankMastery && bbsRankMastery.total > 0 ? (
              <div className="mt-4 flex items-center justify-center gap-3 rounded-xl border border-gatame-gold/30 bg-gatame-gold/5 px-4 py-3">
                <BbsBeltLogo size={40} className="shrink-0" />
                <p className="text-left text-sm text-white/65">
                  Black Belt System (declared ranks):{' '}
                  <span className="font-bold text-gatame-gold">
                    {bbsRankMastery.completed} / {bbsRankMastery.total}
                  </span>
                </p>
              </div>
            ) : null}
            {fullCatalogMastered ? (
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                You have mastered all available techniques! Ready for a review or advanced drills?
              </p>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Great work! Let's start a new chapter to reach even greater heights in your journey.
              </p>
            )}
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                disabled={!canStartNext || nextStageLoading}
                onClick={() => void onStartNextStage()}
                className="rounded-xl bg-gatame-gold px-6 py-3 text-sm font-bold uppercase tracking-wide text-gatame-navy transition-[filter,transform] hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {nextStageLoading ? 'Starting your next stage…' : 'Start Next Stage'}
              </button>
            </div>
            {nextStageLoading ? (
              <p className="mt-4 text-xs text-white/50">Building your next learning street…</p>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
