import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { GATAME_LOGO_SRC } from '../../constants/brandAssets'
import { ghostGoldCtaClass } from '../../constants/brandTheme'
import SignUpEmailSentDialog from './SignUpEmailSentDialog'

const RESET_RESEND_COOLDOWN_SECONDS = 30
const MAGIC_LINK_RESEND_COOLDOWN_SECONDS = 30

/** 0=Too short, 1=Weak, 2=Fair, 3=Good, 4=Strong */
type PasswordStrength = 0 | 1 | 2 | 3 | 4

function evaluatePasswordStrength(pw: string): {
  score: PasswordStrength
  label: string
  hint: string
} {
  if (pw.length < 6) {
    return { score: 0, label: 'Too short', hint: 'Use at least 6 characters.' }
  }
  let score = 1
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const clamped = Math.min(4, score) as PasswordStrength

  const missing: string[] = []
  if (pw.length < 10) missing.push('10+ characters')
  if (!(/[A-Z]/.test(pw) && /[a-z]/.test(pw))) missing.push('upper & lowercase')
  if (!/\d/.test(pw)) missing.push('a number')
  if (!/[^A-Za-z0-9]/.test(pw)) missing.push('a symbol')

  const labelByScore: Record<PasswordStrength, string> = {
    0: 'Too short',
    1: 'Weak',
    2: 'Fair',
    3: 'Good',
    4: 'Strong',
  }
  const hint =
    clamped >= 4
      ? 'Strong password.'
      : missing.length
        ? `Add ${missing.slice(0, 2).join(' and ')} for a stronger password.`
        : ''
  return { score: clamped, label: labelByScore[clamped], hint }
}

const STRENGTH_BAR_COLORS: Record<PasswordStrength, string> = {
  0: 'bg-red-500/80',
  1: 'bg-red-400/80',
  2: 'bg-amber-400/85',
  3: 'bg-lime-500/85',
  4: 'bg-emerald-500/90',
}

/** Kajabi 等から `?email=` で渡されたアドレスを読み取る（React Router 未使用のため URLSearchParams） */
function readEmailFromQuery(): string | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('email')
  if (!raw) return null
  const trimmed = decodeURIComponent(raw).trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return trimmed
}

/** 読み取り後に `email` クエリを URL から除去（ブックマーク・共有時の漏洩を抑える） */
function stripEmailQueryParam(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('email')) return
  params.delete('email')
  const qs = params.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', next)
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

const labelClass =
  'mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-gatame-goldHi/95 group-focus-within:text-gatame-goldHi'

const inputClass =
  [
    'w-full rounded-xl border bg-[#0e1829]/90 px-4 py-3.5 text-[15px] leading-snug text-white',
    'border-gatame-gold/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
    'placeholder:text-white/50 placeholder:font-normal',
    'outline-none transition-[border-color,box-shadow,background-color] duration-200',
    'hover:border-gatame-gold/55 hover:bg-[#101d32]/95',
    'focus:border-gatame-goldHi focus:bg-[#101d32] focus:shadow-[0_0_0_2px_rgba(212,175,55,0.35),0_0_20px_-4px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,255,255,0.06)]',
    'focus-visible:border-gatame-goldHi',
  ].join(' ')

const googleGhostClass =
  'flex w-full items-center justify-center gap-3 rounded-2xl border border-white/28 bg-transparent px-4 py-3.5 text-sm font-semibold text-white transition-[border-color,background-color,color,transform] hover:border-gatame-goldHi/60 hover:bg-gatame-gold/[0.06] hover:text-gatame-goldHi active:scale-[0.99] disabled:opacity-40'

const magicLinkGhostClass =
  'w-full rounded-2xl border border-gatame-gold/35 bg-transparent px-4 py-3.5 text-sm font-semibold text-gatame-goldHi transition-[border-color,background-color] hover:border-gatame-goldHi/55 hover:bg-gatame-gold/[0.06] disabled:opacity-40'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [screen, setScreen] = useState<'auth' | 'forgot'>('auth')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resetSent, setResetSent] = useState(false)
  const [resetCooldown, setResetCooldown] = useState(0)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkCooldown, setMagicLinkCooldown] = useState(0)
  /** Kajabi 等のリンクから email クエリで遷移したか */
  const [emailPrefilledFromUrl, setEmailPrefilledFromUrl] = useState(false)
  /** Sign up 成功後に表示する確認メール送信 POP（メールアドレスを保持） */
  const [signUpEmailSent, setSignUpEmailSent] = useState<string | null>(null)

  useEffect(() => {
    const fromQuery = readEmailFromQuery()
    if (fromQuery) {
      setEmail(fromQuery)
      setEmailPrefilledFromUrl(true)
      setMode('signIn')
      setScreen('auth')
      stripEmailQueryParam()
    }
  }, [])

  useEffect(() => {
    if (resetCooldown <= 0) return
    const t = window.setInterval(() => {
      setResetCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [resetCooldown])

  useEffect(() => {
    if (magicLinkCooldown <= 0) return
    const t = window.setInterval(() => {
      setMagicLinkCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [magicLinkCooldown])

  const clearFeedback = () => {
    setError(null)
    setMessage(null)
  }

  const handleGoogleSignIn = async () => {
    if (!supabase) return
    clearFeedback()
    setBusy(true)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (oauthError) {
        setError(oauthError.message)
      }
    } finally {
      setBusy(false)
    }
  }

  /** Supabase Magic Link（OTP）— Kajabi から email が渡されたユーザー向け */
  const handleMagicLinkSignIn = async () => {
    if (!supabase) return
    if (magicLinkCooldown > 0) return

    const trimmed = email.trim()
    if (!trimmed) {
      alert('Please enter your email address.')
      return
    }

    clearFeedback()
    setBusy(true)
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })
      if (otpError) {
        alert(otpError.message)
        setError(otpError.message)
        return
      }
      setMagicLinkSent(true)
      setMagicLinkCooldown(MAGIC_LINK_RESEND_COOLDOWN_SECONDS)
      setMessage(
        magicLinkSent
          ? 'Sign-in link resent. Check your inbox (including spam).'
          : 'Check your email for the sign-in link.',
      )
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Could not send the sign-in link. Please try again.'
      alert(msg)
      setError(msg)
    } finally {
      setBusy(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    clearFeedback()
    setBusy(true)
    try {
      if (mode === 'signIn') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signInError) {
          setError(signInError.message)
        }
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (signUpError) {
          setError(signUpError.message)
        } else {
          const trimmed = email.trim()
          setPassword('')
          setMode('signIn')
          clearFeedback()
          setSignUpEmailSent(trimmed)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  const handleResetPasswordEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    if (resetCooldown > 0) return
    clearFeedback()
    setBusy(true)
    try {
      const redirectTo = `${window.location.origin}/reset-password`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })
      if (resetError) {
        setError(resetError.message)
      } else {
        setMessage(
          resetSent
            ? 'Reset link resent. Check your inbox (including spam).'
            : 'Check your email for the reset link.',
        )
        setResetSent(true)
        setResetCooldown(RESET_RESEND_COOLDOWN_SECONDS)
      }
    } finally {
      setBusy(false)
    }
  }

  const resetForgotForm = () => {
    setResetSent(false)
    setResetCooldown(0)
    clearFeedback()
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gatame-midnight px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-gatame-navy/30" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-15%,rgba(197,160,89,0.08),transparent_52%)]"
        aria-hidden
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-10 flex flex-col items-center text-center">
          <img
            src={GATAME_LOGO_SRC}
            alt="Gatame"
            className="mb-6 h-12 w-auto object-contain opacity-[0.97] sm:h-14"
            draggable={false}
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gatame-goldHi/90">
            Learning Pass Navigator
          </p>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {screen === 'forgot' ? 'Reset your password' : 'Sign in to build your path'}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            {screen === 'forgot'
              ? 'Enter the email for your account. We will send you a secure link.'
              : 'The Exclusive Gatame Kosen Learning Platform.'}
          </p>
        </div>

        <div className="rounded-2xl border border-gatame-gold/35 bg-gatame-navy/55 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-8">
          {screen === 'auth' ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGoogleSignIn()}
                className={googleGhostClass}
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-gatame-goldHi/35 to-transparent" />
                </div>
                <div className="relative flex justify-center text-xs font-medium uppercase tracking-widest text-gatame-goldHi/85">
                  <span className="bg-gatame-navy/95 px-3 text-[11px]">or</span>
                </div>
              </div>

              <form onSubmit={(e) => void handleEmailAuth(e)} className="space-y-4">
                <div className="group">
                  <label htmlFor="auth-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (magicLinkSent) setMagicLinkSent(false)
                    }}
                    className={inputClass}
                    placeholder="you@example.com"
                    disabled={busy}
                  />
                  {emailPrefilledFromUrl && mode === 'signIn' ? (
                    <p className="mt-2 text-[12px] leading-snug text-gatame-goldHi/80">
                      We pre-filled your email from your membership link. Use the sign-in link below
                      if you do not use a password.
                    </p>
                  ) : null}
                </div>
                <div className="group">
                  <label htmlFor="auth-password" className={labelClass}>
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                    required={mode === 'signUp'}
                    minLength={mode === 'signUp' ? 6 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                    disabled={busy}
                  />
                  {mode === 'signUp' && password.length > 0 ? (
                    (() => {
                      const { score, label, hint } = evaluatePasswordStrength(password)
                      return (
                        <div className="mt-2">
                          <div className="flex h-1.5 gap-1" aria-hidden>
                            {[0, 1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className={`h-full flex-1 rounded-full transition-colors ${
                                  i < score ? STRENGTH_BAR_COLORS[score] : 'bg-white/12'
                                }`}
                              />
                            ))}
                          </div>
                          <div
                            className="mt-1.5 flex items-center justify-between gap-3 text-[11px] font-medium"
                            aria-live="polite"
                          >
                            <span
                              className={
                                score >= 3
                                  ? 'text-emerald-300/90'
                                  : score === 2
                                    ? 'text-amber-300/90'
                                    : 'text-red-300/90'
                              }
                            >
                              {label}
                            </span>
                            <span className="text-right text-white/55">{hint}</span>
                          </div>
                        </div>
                      )
                    })()
                  ) : null}
                  {mode === 'signIn' ? (
                    <div className="mt-1.5 flex justify-end">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setScreen('forgot')
                          clearFeedback()
                        }}
                        className="text-[11px] font-medium tracking-wide text-gatame-gold/78 underline decoration-gatame-gold/35 underline-offset-[5px] transition-colors hover:text-gatame-goldHi hover:decoration-gatame-goldHi/50"
                      >
                        Forgot password?
                      </button>
                    </div>
                  ) : null}
                </div>

                {error ? (
                  <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200/95">
                    {error}
                  </p>
                ) : null}
                {message ? (
                  <p className="rounded-xl border border-gatame-goldHi/50 bg-gatame-gold/[0.08] px-3 py-2.5 text-sm leading-snug text-gatame-goldHi shadow-[0_0_24px_-8px_rgba(197,160,89,0.35)]">
                    {message}
                  </p>
                ) : null}

                <div className="flex gap-2 rounded-2xl border border-gatame-gold/25 bg-gatame-midnight/40 p-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode('signIn')
                      clearFeedback()
                    }}
                    className={[
                      'flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors',
                      mode === 'signIn'
                        ? 'border border-gatame-gold/70 bg-gatame-gold/[0.08] text-gatame-gold'
                        : 'text-white/62 hover:bg-white/[0.05] hover:text-white/88',
                    ].join(' ')}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode('signUp')
                      clearFeedback()
                      setMagicLinkSent(false)
                    }}
                    className={[
                      'flex-1 rounded-xl py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors',
                      mode === 'signUp'
                        ? 'border border-gatame-gold/70 bg-gatame-gold/[0.08] text-gatame-gold'
                        : 'text-white/62 hover:bg-white/[0.05] hover:text-white/88',
                    ].join(' ')}
                  >
                    Sign Up
                  </button>
                </div>

                {mode === 'signIn' ? (
                  <>
                    <button type="submit" disabled={busy} className={`${ghostGoldCtaClass} w-full`}>
                      Sign In with Email
                    </button>
                    <button
                      type="button"
                      disabled={busy || magicLinkCooldown > 0}
                      onClick={() => void handleMagicLinkSignIn()}
                      className={magicLinkGhostClass}
                    >
                      {magicLinkSent
                        ? magicLinkCooldown > 0
                          ? `Resend sign-in link in ${magicLinkCooldown}s`
                          : 'Resend sign-in link'
                        : 'Email me a sign-in link'}
                    </button>
                  </>
                ) : (
                  <button type="submit" disabled={busy} className={`${ghostGoldCtaClass} w-full`}>
                    Create Account
                  </button>
                )}
              </form>
            </>
          ) : (
            <form onSubmit={(e) => void handleResetPasswordEmail(e)} className="space-y-5">
              <div className="group">
                <label htmlFor="forgot-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                  disabled={busy}
                />
              </div>

              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200/95">
                  {error}
                </p>
              ) : null}
              {message ? (
                <p
                  role="status"
                  className="rounded-xl border border-gatame-goldHi/50 bg-gradient-to-b from-gatame-gold/[0.12] to-gatame-gold/[0.05] px-3 py-3 text-sm font-medium leading-snug text-gatame-goldHi shadow-[0_0_28px_-10px_rgba(197,160,89,0.45)]"
                >
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={busy || resetCooldown > 0}
                className={`${ghostGoldCtaClass} w-full`}
              >
                {resetSent
                  ? resetCooldown > 0
                    ? `Resend in ${resetCooldown}s`
                    : 'Resend reset link'
                  : 'Reset Password'}
              </button>

              {resetSent ? (
                <div className="text-center">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={resetForgotForm}
                    className="text-[11px] font-medium tracking-wide text-gatame-gold/78 underline decoration-gatame-gold/35 underline-offset-[5px] transition-colors hover:text-gatame-goldHi hover:decoration-gatame-goldHi/50"
                  >
                    Wrong email? Use a different address
                  </button>
                </div>
              ) : null}

              <div className="pt-1 text-center">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setScreen('auth')
                    resetForgotForm()
                  }}
                  className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-gatame-goldHi/90"
                >
                  Back to sign in
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/48">
          Secure access powered by Supabase
        </p>
      </motion.div>

      <SignUpEmailSentDialog
        open={signUpEmailSent !== null}
        email={signUpEmailSent ?? ''}
        onContinue={() => setSignUpEmailSent(null)}
      />
    </div>
  )
}
