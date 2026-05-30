import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import {
  saveProgressAuthInputClass,
  saveProgressAuthOutlineClass,
  saveProgressCtaClass,
} from '../../constants/brandTheme'
import en from '../../locales/en.json'
import { magicLinkRedirectTo, oauthRedirectToTop } from '../../utils/authRoutes'
import { supabase } from '../../utils/supabaseClient'

const COOLDOWN_KEY = 'gatame.magic-link-cooldown.v1'
const COOLDOWN_MS = 15 * 60 * 1000
const MAX_SENDS_PER_WINDOW = 3

type SyncSaveModalProps = {
  open: boolean
  onClose: () => void
}

function canSendMagicLink(): { ok: boolean; waitSec: number } {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY)
    const now = Date.now()
    if (!raw) return { ok: true, waitSec: 0 }
    const parsed = JSON.parse(raw) as { windowStart: number; count: number }
    if (now - parsed.windowStart > COOLDOWN_MS) return { ok: true, waitSec: 0 }
    if (parsed.count >= MAX_SENDS_PER_WINDOW) {
      const waitSec = Math.ceil((parsed.windowStart + COOLDOWN_MS - now) / 1000)
      return { ok: false, waitSec: Math.max(0, waitSec) }
    }
    return { ok: true, waitSec: 0 }
  } catch {
    return { ok: true, waitSec: 0 }
  }
}

function recordMagicLinkSend(): void {
  try {
    const now = Date.now()
    const raw = localStorage.getItem(COOLDOWN_KEY)
    let windowStart = now
    let count = 1
    if (raw) {
      const parsed = JSON.parse(raw) as { windowStart: number; count: number }
      if (now - parsed.windowStart <= COOLDOWN_MS) {
        windowStart = parsed.windowStart
        count = parsed.count + 1
      }
    }
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify({ windowStart, count }))
  } catch {
    /* ignore */
  }
}

export default function SyncSaveModal({ open, onClose }: SyncSaveModalProps) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldownSec, setCooldownSec] = useState(0)

  useEffect(() => {
    if (!open) {
      setSent(false)
      setError(null)
      setBusy(false)
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tick = () => {
      const { waitSec } = canSendMagicLink()
      setCooldownSec(waitSec)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      window.clearInterval(id)
    }
  }, [open, busy, onClose])

  const sendOtp = useCallback(async (targetEmail: string): Promise<boolean> => {
    if (!supabase) return false
    const gate = canSendMagicLink()
    if (!gate.ok) {
      setError(en.syncSave.cooldownError.replace('{n}', String(gate.waitSec)))
      return false
    }

    const trimmed = targetEmail.trim()
    if (!trimmed) return false

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: magicLinkRedirectTo() },
    })

    if (otpError) {
      setError(otpError.message)
      return false
    }
    recordMagicLinkSend()
    return true
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError(en.syncSave.emailRequired)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const ok = await sendOtp(trimmed)
      if (ok) setSent(true)
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirectToTop(),
          queryParams: { prompt: 'select_account' },
        },
      })
      if (oauthError) {
        setError(oauthError.message)
      }
    } finally {
      setBusy(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label={en.syncSave.close}
            className="fixed inset-0 z-[220] bg-black/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => (!busy ? onClose() : undefined)}
          />
          <div className="pointer-events-none fixed inset-0 z-[225] flex items-center justify-center px-4 py-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sync-save-title"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto relative w-full max-w-md rounded-2xl border border-emerald-400/35 bg-gatame-navy p-6 shadow-[0_28px_90px_rgba(0,0,0,0.72)]"
            >
              <h2 id="sync-save-title" className="text-lg font-bold text-white">
                {en.syncSave.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{en.syncSave.description}</p>

              {sent ? (
                <div
                  role="status"
                  className="mt-4 rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
                >
                  <p>{en.syncSave.successMessage}</p>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-100/90">
                    {en.auth.magicLinkSenderNote}
                  </p>
                </div>
              ) : (
                <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
                  {error ? (
                    <p role="alert" className="text-sm text-red-300">
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleGoogleSignIn()}
                    className={saveProgressAuthOutlineClass}
                  >
                    {en.syncSave.googleSignIn}
                  </button>

                  <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                    {en.syncSave.orDivider}
                  </p>

                  <div>
                    <label
                      htmlFor="sync-save-email"
                      className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200/95"
                    >
                      {en.syncSave.emailLabel}
                    </label>
                    <input
                      id="sync-save-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                      }}
                      className={saveProgressAuthInputClass}
                      placeholder="you@example.com"
                      disabled={busy}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy || cooldownSec > 0}
                    className={`${saveProgressCtaClass} w-full justify-center normal-case tracking-normal`}
                  >
                    {busy
                      ? en.syncSave.sending
                      : cooldownSec > 0
                        ? en.syncSave.cooldown.replace('{n}', String(cooldownSec))
                        : en.syncSave.sendMagicLink}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full text-center text-sm text-white/55 underline underline-offset-2 hover:text-white/80"
              >
                {en.syncSave.close}
              </button>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
