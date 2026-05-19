import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastEntry {
  id: number
  message: string
  variant: ToastVariant
  /** ms */
  duration: number
}

const GATAME_TOAST_EVENT = 'gatame-toast' as const

let nextId = 1

interface ToastEventDetail {
  message: string
  variant?: ToastVariant
  duration?: number
}

/**
 * グローバルなトースト発火関数。任意のコンポーネントから呼べる。
 * @param message ユーザー向け文言
 * @param variant 'error' は赤系、'success' は金系、'info' はグレー
 * @param duration 表示時間 ms（既定 4500）
 */
export function showToast(message: string, variant: ToastVariant = 'info', duration = 4500): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent<ToastEventDetail>(GATAME_TOAST_EVENT, {
        detail: { message, variant, duration },
      }),
    )
  } catch {
    /* ignore */
  }
}

const variantClass: Record<ToastVariant, string> = {
  info: 'border-white/15 bg-slate-900/95 text-white/90',
  success: 'border-gatame-gold/45 bg-gatame-midnight/95 text-gatame-goldHi',
  error: 'border-red-500/40 bg-red-950/90 text-red-100',
}

export function ToastHost() {
  const [items, setItems] = useState<ToastEntry[]>([])

  useEffect(() => {
    const onToast = (e: Event) => {
      const d = (e as CustomEvent<ToastEventDetail>).detail
      if (!d || typeof d.message !== 'string') return
      const entry: ToastEntry = {
        id: nextId++,
        message: d.message,
        variant: d.variant ?? 'info',
        duration: typeof d.duration === 'number' && d.duration > 0 ? d.duration : 4500,
      }
      setItems((prev) => [...prev, entry])
      const t = window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== entry.id))
      }, entry.duration)
      return () => window.clearTimeout(t)
    }
    window.addEventListener(GATAME_TOAST_EVENT, onToast)
    return () => window.removeEventListener(GATAME_TOAST_EVENT, onToast)
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[200] flex flex-col items-center gap-2 px-4 sm:top-6"
      role="region"
      aria-label="Notifications"
    >
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 text-sm shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-md ${variantClass[t.variant]}`}
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
