import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GATAME_LOGO_SRC } from '../../constants/brandAssets'
import { ghostGoldCtaClass } from '../../constants/brandTheme'
import { readEmailFromQuery, stripEmailQueryParam } from '../../utils/emailQuery'
import { dashboardUrl, redirectToDashboard } from '../../utils/authRoutes'
import { supabase } from '../../utils/supabaseClient'

const RESEND_COOLDOWN_SECONDS = 30

const COPY = {
  siteAccess: '会員サイトへアクセス',
  lead:
    'メールアドレスを入力し、アクセス用リンクを受け取ってください。パスワードは不要です。',
  emailLabel: 'メールアドレス',
  emailPlaceholder: 'you@example.com',
  submit: 'アクセス用リンクを受け取る',
  resend: 'リンクを再送する',
  resendWait: (sec: number) => `再送まで ${sec} 秒`,
  prefilledHint:
    '会員登録時のメールアドレスを自動入力しました。下のボタンでアクセス用リンクを受け取れます。',
  success:
    'アクセス用リンクをメールに送信しました。受信トレイ（迷惑メールフォルダも）をご確認ください。',
  successResent: 'アクセス用リンクを再送しました。メールをご確認ください。',
  emptyEmail: 'メールアドレスを入力してください。',
  sendFailed: 'リンクの送信に失敗しました。しばらくしてから再度お試しください。',
  checkingSession: '接続を確認しています…',
} as const

const labelClass =
  'mb-2 block text-[13px] font-semibold uppercase tracking-[0.12em] text-gatame-goldHi/95'

const inputClass =
  [
    'w-full rounded-xl border bg-[#0e1829]/90 px-4 py-3.5 text-[15px] leading-snug text-white',
    'border-gatame-gold/40 placeholder:text-white/50',
    'outline-none transition-[border-color,box-shadow] duration-200',
    'focus:border-gatame-goldHi focus:shadow-[0_0_0_2px_rgba(212,175,55,0.35)]',
  ].join(' ')

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionChecking, setSessionChecking] = useState(true)
  const [linkSent, setLinkSent] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emailPrefilled, setEmailPrefilled] = useState(false)

  useEffect(() => {
    const fromQuery = readEmailFromQuery()
    if (fromQuery) {
      setEmail(fromQuery)
      setEmailPrefilled(true)
      stripEmailQueryParam()
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [cooldown])

  useEffect(() => {
    const client = supabase
    if (!client) {
      setSessionChecking(false)
      return
    }

    let mounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession()
        if (!mounted) return
        if (session) {
          redirectToDashboard()
          return
        }
      } finally {
        if (mounted) setSessionChecking(false)
      }
    }

    void checkSession()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        redirectToDashboard()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const sendAccessLink = useCallback(async () => {
    if (!supabase) return
    if (cooldown > 0) return

    const trimmed = email.trim()
    if (!trimmed) {
      setError(COPY.emptyEmail)
      return
    }

    setError(null)
    setMessage(null)
    setBusy(true)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: dashboardUrl(),
        },
      })

      if (otpError) {
        setError(otpError.message)
        return
      }

      const wasSent = linkSent
      setLinkSent(true)
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setMessage(wasSent ? COPY.successResent : COPY.success)
    } catch (err) {
      const msg = err instanceof Error ? err.message : COPY.sendFailed
      setError(msg)
    } finally {
      setBusy(false)
    }
  }, [cooldown, email, linkSent])

  if (sessionChecking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gatame-midnight px-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-gatame-gold border-t-transparent"
          role="status"
          aria-label="Loading"
        />
        <p className="mt-4 text-sm text-white/50">{COPY.checkingSession}</p>
      </div>
    )
  }

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
            {COPY.siteAccess}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">{COPY.lead}</p>
        </div>

        <div className="rounded-2xl border border-gatame-gold/35 bg-gatame-navy/55 p-6 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.75)] backdrop-blur-md sm:p-8">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              void sendAccessLink()
            }}
          >
            <div>
              <label htmlFor="access-email" className={labelClass}>
                {COPY.emailLabel}
              </label>
              <input
                id="access-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (linkSent) setLinkSent(false)
                  setError(null)
                }}
                className={inputClass}
                placeholder={COPY.emailPlaceholder}
                disabled={busy}
              />
              {emailPrefilled ? (
                <p className="mt-2 text-[12px] leading-snug text-gatame-goldHi/85">
                  {COPY.prefilledHint}
                </p>
              ) : null}
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-sm text-red-200/95"
              >
                {error}
              </p>
            ) : null}

            {message ? (
              <p
                role="status"
                className="rounded-xl border border-gatame-goldHi/50 bg-gatame-gold/[0.08] px-3 py-2.5 text-sm leading-snug text-gatame-goldHi"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy || cooldown > 0}
              className={`${ghostGoldCtaClass} w-full normal-case tracking-normal`}
            >
              {busy
                ? '送信中…'
                : linkSent
                  ? cooldown > 0
                    ? COPY.resendWait(cooldown)
                    : COPY.resend
                  : COPY.submit}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
