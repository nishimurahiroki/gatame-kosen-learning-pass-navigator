import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { GATAME_LOGO_SRC } from '../../constants/brandAssets'
import { ghostGoldCtaClass, ghostGoldCtaSubtleClass } from '../../constants/brandTheme'

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

export default function ResetPasswordScreen() {
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      setHasSession(false)
      return
    }
    let cancelled = false

    const sync = async () => {
      const { data } = await supabase!.auth.getSession()
      if (cancelled) return
      setHasSession(Boolean(data.session))
      setReady(true)
    }

    void sync()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return
      if (event === 'PASSWORD_RECOVERY' || nextSession) {
        setHasSession(Boolean(nextSession))
        setReady(true)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        return
      }
      // 成功: 成功ビューに切替えてから sign out。即遷移はせず、ユーザーが
      // 「Continue to sign in」を押した時に / へ遷移する。
      await supabase.auth.signOut()
      setSuccess(true)
    } finally {
      setBusy(false)
    }
  }

  const handleContinueToSignIn = () => {
    window.location.replace('/')
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
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">Set a new password</h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            Choose a strong password for your Gatame account.
          </p>
        </div>

        <div className="rounded-2xl border border-gatame-gold/35 bg-gatame-navy/55 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-8">
          {!ready ? (
            <p className="text-center text-sm text-white/55">Verifying reset link…</p>
          ) : success ? (
            <div className="space-y-5 text-center">
              <div
                aria-hidden
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/60 bg-emerald-500/15 text-2xl text-emerald-200"
              >
                ✓
              </div>
              <div>
                <p className="text-base font-bold text-white">Password updated</p>
                <p className="mt-2 text-sm leading-relaxed text-white/72">
                  Your password has been changed and your previous session has been signed out.
                  Continue to sign in with the new password.
                </p>
              </div>
              <button
                type="button"
                onClick={handleContinueToSignIn}
                className={`${ghostGoldCtaClass} w-full`}
              >
                Continue to sign in
              </button>
            </div>
          ) : !hasSession ? (
            <div className="space-y-5 text-center">
              <p className="text-sm leading-relaxed text-white/72">
                This reset link is invalid or has expired. Request a new one from the sign-in page.
              </p>
              <a href="/" className={`${ghostGoldCtaSubtleClass} inline-flex w-full justify-center no-underline`}>
                Back to sign in
              </a>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div className="group">
                <label htmlFor="reset-password-new" className={labelClass}>
                  New Password
                </label>
                <input
                  id="reset-password-new"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  disabled={busy}
                />
              </div>
              <div className="group">
                <label htmlFor="reset-password-confirm" className={labelClass}>
                  Confirm New Password
                </label>
                <input
                  id="reset-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  disabled={busy}
                />
              </div>
              {error ? (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200/95">
                  {error}
                </p>
              ) : null}
              <button type="submit" disabled={busy} className={`${ghostGoldCtaClass} w-full`}>
                Update password
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-[11px] leading-relaxed text-white/48">
          Secure access powered by Supabase
        </p>
      </motion.div>
    </div>
  )
}
