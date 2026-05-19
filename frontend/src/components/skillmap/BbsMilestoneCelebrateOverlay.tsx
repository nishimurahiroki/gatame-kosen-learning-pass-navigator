import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import type { BbsLevelKey } from '../../constants/bbsOffers'
import { BBS_LEVEL_DISPLAY_EN } from '../../constants/bbsOffers'
import BbsBeltLogo from './BbsBeltLogo'

function ConfettiBurst({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    const colors = ['#c5a059', '#fef3c7', '#38bdf8', '#34d399', '#f472b6', '#a78bfa']
    return Array.from({ length: 36 }, (_, i) => {
      const left = ((seed * 13 + i * 37) % 1000) / 10
      const delay = (i % 10) * 0.02
      const duration = 1.8 + (i % 4) * 0.12
      const rot = ((seed + i * 41) % 720) - 360
      return { left, delay, duration, rot, color: colors[i % colors.length] }
    })
  }, [seed])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute top-[40%] h-2.5 w-2 rounded-sm opacity-95"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            rotate: p.rot,
          }}
          initial={{ y: 0, opacity: 0, scale: 0.6 }}
          animate={{
            y: [0, -120, 320],
            x: [0, (i % 5) * 8 - 16, (i % 7) * 10 - 30],
            opacity: [0, 1, 1, 0],
            rotate: [p.rot, p.rot + 420],
            scale: [0.6, 1, 0.9],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </div>
  )
}

export default function BbsMilestoneCelebrateOverlay({
  level,
}: {
  level: BbsLevelKey | null
}) {
  const name = level ? BBS_LEVEL_DISPLAY_EN[level] : ''
  return (
    <AnimatePresence>
      {level ? (
        <motion.div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="presentation"
          aria-live="polite"
        >
          <ConfettiBurst seed={level.length * 997 + 13} />
          <motion.div
            className="relative z-10 max-w-sm rounded-2xl border border-emerald-500/40 bg-slate-950/95 px-8 py-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0.88, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 320 }}
          >
            <BbsBeltLogo size={56} className="mx-auto" />
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.25em] text-emerald-300/90">Level recorded</p>
            <p className="mt-2 text-2xl font-black text-white">{name}</p>
            <p className="mt-2 text-sm text-white/70">Outstanding — keep building on the mat.</p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
