import { useEffect, useId, useState, type CSSProperties } from 'react'

/** チェック時の小さなパーティクル演出 */
export function TodoCheckboxBurst({ fire }: { fire: number }) {
  const rid = useId().replace(/:/g, '')
  const [particles, setParticles] = useState<{ x: number; y: number; rot: number; delay: number }[]>([])

  useEffect(() => {
    if (!fire) return
    const next = Array.from({ length: 10 }, (_, i) => ({
      x: Math.cos((i / 10) * Math.PI * 2) * (18 + Math.random() * 16),
      y: Math.sin((i / 10) * Math.PI * 2) * (18 + Math.random() * 16) - 6,
      rot: (Math.random() - 0.5) * 220,
      delay: i * 12,
    }))
    setParticles(next)
    const t = window.setTimeout(() => setParticles([]), 700)
    return () => window.clearTimeout(t)
  }, [fire])

  if (!particles.length) return null

  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
      {particles.map((p, i) => (
        <span
          key={`${rid}-${fire}-${i}`}
          className="absolute h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.9)]"
          style={
            {
              animation: `todo-burst 620ms ease-out ${p.delay}ms both`,
              '--bx': `${p.x}px`,
              '--by': `${p.y}px`,
              '--br': `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
      <style>{`
        @keyframes todo-burst {
          from {
            opacity: 1;
            transform: translate(0,0) rotate(0deg) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(var(--bx), var(--by)) rotate(var(--br)) scale(0.2);
          }
        }
      `}</style>
    </span>
  )
}
