import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'
import { ghostGoldCtaClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'

const RESEND_COOLDOWN_SECONDS = 30

function MailSentIcon() {
  return (
    <motion.div
      className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gatame-gold/40 bg-gatame-gold/[0.12] shadow-[0_0_32px_-8px_rgba(197,160,89,0.45)]"
      aria-hidden
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.05 }}
    >
      <svg className="h-8 w-8 text-gatame-goldHi" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    </motion.div>
  )
}

export interface SignUpEmailSentDialogProps {
  open: boolean
  email: string
  onContinue: () => void
}

/**
 * Sign up 完了後、確認メール送信をユーザーに確実に伝えるモーダル（POP）。
 */
export default function SignUpEmailSentDialog({
  open,
  email,
  onContinue,
}: SignUpEmailSentDialogProps) {
  const [resendBusy, setResendBusy] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [resendNote, setResendNote] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (!open) {
      setResendError(null)
      setResendNote(null)
      setResendCooldown(0)
    }
  }, [open])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = window.setInterval(() => {
      setResendCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [resendCooldown])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !resendBusy) onContinue()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, resendBusy, onContinue])

  const handleResend = async () => {
    if (!supabase || !email || resendCooldown > 0 || resendBusy) return
    setResendError(null)
    setResendNote(null)
    setResendBusy(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      })
      if (error) {
        setResendError(error.message)
      } else {
        setResendNote(en.auth.signUpEmailSent.resendSuccess)
        setResendCooldown(RESEND_COOLDOWN_SECONDS)
      }
    } finally {
      setResendBusy(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={en.auth.signUpEmailSent.close}
            className="fixed inset-0 z-[190] bg-black/70 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => (!resendBusy ? onContinue() : undefined)}
          />
          <motion.div
            className="pointer-events-none fixed inset-0 z-[195] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="signup-email-sent-title"
              aria-describedby="signup-email-sent-desc"
              className="pointer-events-auto w-[min(92vw,440px)] overflow-hidden rounded-2xl border border-gatame-gold/40 bg-gatame-navy shadow-[0_28px_90px_-20px_rgba(0,0,0,0.85),0_0_48px_-12px_rgba(197,160,89,0.25)]"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className="bg-gradient-to-b from-gatame-gold/[0.14] to-transparent px-6 pb-3 pt-8 text-center"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.35 }}
              >
                <MailSentIcon />
                <h2
                  id="signup-email-sent-title"
                  className="mt-4 text-xl font-bold tracking-tight text-white"
                >
                  {en.auth.signUpEmailSent.title}
                </h2>
              </motion.div>

              <motion.div
                id="signup-email-sent-desc"
                className="space-y-3 px-6 pb-6 pt-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.35 }}
              >
                <div className="rounded-xl border border-gatame-gold/45 bg-gatame-midnight/80 px-4 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gatame-goldHi/75">
                      {en.auth.signUpEmailSent.fromLabel}
                    </span>
                    <span className="text-right font-bold text-gatame-goldHi">
                      {en.auth.signUpEmailSent.fromName}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 pt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                      {en.auth.signUpEmailSent.toLabel}
                    </span>
                    <span className="break-all text-right font-medium text-white">{email}</span>
                  </div>
                </div>

                <p className="text-center text-sm leading-snug text-white/78">
                  {en.auth.signUpEmailSent.instruction}
                </p>

                <p className="text-center text-xs text-white/50">{en.auth.signUpEmailSent.spamHint}</p>

                {resendError ? (
                  <p className="rounded-lg border border-red-500/35 bg-red-950/40 px-3 py-2 text-center text-xs text-red-200/95">
                    {resendError}
                  </p>
                ) : null}
                {resendNote ? (
                  <p
                    role="status"
                    className="rounded-lg border border-emerald-500/35 bg-emerald-950/30 px-3 py-2 text-center text-xs text-emerald-200/95"
                  >
                    {resendNote}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={resendBusy}
                  onClick={() => void handleResend()}
                  className="w-full text-center text-xs font-medium text-gatame-gold/85 underline decoration-gatame-gold/40 underline-offset-[5px] transition-colors hover:text-gatame-goldHi disabled:opacity-50"
                >
                  {resendCooldown > 0
                    ? en.auth.signUpEmailSent.resendCooldown.replace('{s}', String(resendCooldown))
                    : en.auth.signUpEmailSent.resend}
                </button>

                <button
                  type="button"
                  disabled={resendBusy}
                  onClick={onContinue}
                  className={`${ghostGoldCtaClass} w-full`}
                >
                  {en.auth.signUpEmailSent.continue}
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
