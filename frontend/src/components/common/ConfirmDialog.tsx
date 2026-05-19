import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export type ConfirmTone = 'default' | 'destructive'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  /** 1 段落の説明文。改行は文章で表現する。 */
  description?: string
  confirmLabel: string
  cancelLabel: string
  /** 主要 CTA の配色: destructive は赤系、default は金系。 */
  tone?: ConfirmTone
  busy?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

const toneClass: Record<ConfirmTone, string> = {
  default:
    'bg-gatame-gold text-gatame-navy hover:brightness-110 active:scale-[0.99]',
  destructive:
    'bg-red-600/90 text-white hover:bg-red-500 active:scale-[0.99]',
}

/**
 * 取り消し不能 / 破壊的なアクションに使う 2 ボタン確認ダイアログ。
 * バックドロップ・Esc キー・Cancel ボタンのいずれでも閉じる。
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'default',
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={cancelLabel}
            className="fixed inset-0 z-[180] bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => (!busy ? onCancel() : undefined)}
          />
          <div className="pointer-events-none fixed inset-0 z-[185] flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              className="pointer-events-auto w-[min(92vw,420px)] rounded-2xl border border-gatame-gold/35 bg-slate-900 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            >
              <h2 id="confirm-dialog-title" className="text-lg font-bold text-white">
                {title}
              </h2>
              {description ? (
                <p className="mt-2 text-sm leading-relaxed text-white/72">{description}</p>
              ) : null}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCancel}
                  className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-slate-800/80 disabled:opacity-50"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onConfirm()}
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-[filter,transform,background-color] disabled:cursor-not-allowed disabled:opacity-50 ${toneClass[tone]}`}
                >
                  {confirmLabel}
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
