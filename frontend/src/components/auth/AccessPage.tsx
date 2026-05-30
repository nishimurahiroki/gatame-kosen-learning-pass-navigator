import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GATAME_LOGO_SRC } from '../../constants/brandAssets'
import {
  saveProgressAuthInputClass,
  saveProgressAuthOutlineClass,
  saveProgressCtaClass,
} from '../../constants/brandTheme'
import en from '../../locales/en.json'
import {
  readEmailFromQuery,
  readUnexpandedKajabiEmailTemplate,
  stripEmailQueryParam,
} from '../../utils/emailQuery'
import { magicLinkRedirectTo, oauthRedirectToTop, redirectToDiagnostic } from '../../utils/authRoutes'
import { resolveAuthenticatedUserId } from '../../utils/authVerify'
import { supabase } from '../../utils/supabaseClient'

type Phase = 'checking' | 'form' | 'sent'

const labelClass =
  'mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald-200/95'

export default function AccessPage() {
  /** 初回描画から Kajabi の email を反映（プレースホルダだけ見えないようにする） */
  const [email, setEmail] = useState(() => readEmailFromQuery() ?? '')
  const [prefilledFromUrl, setPrefilledFromUrl] = useState(() => Boolean(readEmailFromQuery()))
  const [phase, setPhase] = useState<Phase>('checking')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [kajabiTemplateWarning, setKajabiTemplateWarning] = useState<string | null>(
    () => readUnexpandedKajabiEmailTemplate(),
  )

  useEffect(() => {
    setKajabiTemplateWarning(readUnexpandedKajabiEmailTemplate())
    const fromUrl = readEmailFromQuery()
    if (fromUrl) {
      setEmail(fromUrl)
      setPrefilledFromUrl(true)
    }
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) {
      setPhase('form')
      return
    }

    let mounted = true

    const init = async () => {
      try {
        const userId = await resolveAuthenticatedUserId()
        if (!mounted) return
        if (userId) {
          redirectToDiagnostic()
          return
        }
      } catch {
        /* 続行してフォーム表示 */
      }

      if (mounted) setPhase('form')
    }

    void init()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        redirectToDiagnostic()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const sendOtp = useCallback(async (targetEmail: string): Promise<boolean> => {
    if (!supabase) return false
    const trimmed = targetEmail.trim()
    if (!trimmed) return false

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: magicLinkRedirectTo(),
      },
    })

    if (otpError) {
      setError(otpError.message)
      return false
    }
    return true
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    const trimmed = email.trim()
    if (!trimmed) {
      setError(en.access.emailRequired)
      return
    }

    setBusy(true)
    setError(null)
    setMessage(null)

    try {
      const ok = await sendOtp(trimmed)
      if (ok) {
        stripEmailQueryParam()
        setMessage(en.access.successMessage)
        setPhase('sent')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : en.access.sendFailed)
    } finally {
      setBusy(false)
    }
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) return
    setBusy(true)
    setError(null)
    setMessage(null)
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

  const showForm = phase === 'form'
  const showChecking = phase === 'checking'
  const showSuccessOnly = phase === 'sent' && message

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gatame-midnight px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gatame-navy/30" aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={GATAME_LOGO_SRC}
            alt="Gatame"
            className="mb-5 h-12 w-auto object-contain sm:h-14"
            draggable={false}
          />
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {en.access.title}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">{en.access.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-emerald-400/35 bg-gatame-navy/55 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-8">
          {showChecking ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div
                className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent"
                role="status"
                aria-label="Loading"
              />
              <p className="mt-4 text-sm text-white/70">{en.access.checking}</p>
            </div>
          ) : null}

          {showSuccessOnly ? (
            <p
              role="status"
              className="rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-4 py-4 text-center text-sm leading-relaxed text-emerald-100"
            >
              {message}
            </p>
          ) : null}

          {kajabiTemplateWarning && !showChecking && !showSuccessOnly ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-3 text-sm leading-relaxed text-amber-100"
            >
              {en.access.kajabiWarning.replace('{token}', kajabiTemplateWarning)}
            </p>
          ) : null}

          {error && !showChecking && !showSuccessOnly ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200/95"
            >
              {error}
            </p>
          ) : null}

          {showForm ? (
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <p className="text-sm leading-relaxed text-white/70">
                {prefilledFromUrl ? en.access.prefilledHint : en.access.defaultHint}
              </p>

              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGoogleSignIn()}
                className={saveProgressAuthOutlineClass}
              >
                {en.access.googleSignIn}
              </button>

              <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                {en.access.orDivider}
              </p>

              <div>
                <label htmlFor="access-page-email" className={labelClass}>
                  {en.access.emailLabel}
                </label>
                <input
                  id="access-page-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setPrefilledFromUrl(false)
                    setError(null)
                  }}
                  className={saveProgressAuthInputClass}
                  placeholder={prefilledFromUrl ? undefined : 'you@example.com'}
                  disabled={busy}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className={`${saveProgressCtaClass} w-full justify-center normal-case tracking-normal`}
              >
                {busy ? en.access.sending : en.access.sendMagicLink}
              </button>
            </form>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}
