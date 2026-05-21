import { useCallback, useEffect, useState } from 'react'
import { GATAME_LOGO_SRC } from '../../constants/brandAssets'
import { readEmailFromQuery } from '../../utils/emailQuery'
import { magicLinkRedirectTo, redirectToDiagnostic } from '../../utils/authRoutes'
import { resolveAuthenticatedUserId } from '../../utils/authVerify'
import { supabase } from '../../utils/supabaseClient'

const SUCCESS_MESSAGE =
  'アクセス用リンクをメールにお送りしました。ご確認ください。'

/**
 * アプリの入り口（Kajabi 導線）。
 * パスワード不要・Magic Link のみ。React Router 未使用のため URL は URLSearchParams で解析。
 */
export default function LoginPage() {
  const [email, setEmail] = useState(() => readEmailFromQuery() ?? '')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fromQuery = readEmailFromQuery()
    if (fromQuery) setEmail(fromQuery)
  }, [])

  useEffect(() => {
    const client = supabase
    if (!client) {
      setReady(true)
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
      } finally {
        if (mounted) setReady(true)
      }
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

  const startAccess = useCallback(async () => {
    if (!supabase) return

    const trimmed = email.trim()
    if (!trimmed) {
      setError('メールアドレスを入力してください。')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: magicLinkRedirectTo(),
        },
      })

      if (otpError) {
        setError(otpError.message)
        return
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信に失敗しました。')
    } finally {
      setBusy(false)
    }
  }, [email])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <img
            src={GATAME_LOGO_SRC}
            alt="Gatame"
            className="mb-6 h-10 w-auto object-contain"
            draggable={false}
          />
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">
            学習パスをはじめる
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            メールアドレスだけでアクセスできます。
          </p>
        </div>

        {sent ? (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center text-sm leading-relaxed text-emerald-900"
          >
            {SUCCESS_MESSAGE}
          </p>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void startAccess()
            }}
          >
            <div>
              <label htmlFor="entry-email" className="sr-only">
                メールアドレス
              </label>
              <input
                id="entry-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                placeholder="メールアドレス"
                disabled={busy}
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3.5 text-[15px] text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 focus:bg-white focus:ring-2 focus:ring-neutral-200/80"
              />
            </div>

            {error ? (
              <p role="alert" className="text-center text-sm text-red-600">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-neutral-900 px-4 py-3.5 text-[15px] font-semibold text-white transition-opacity hover:bg-neutral-800 disabled:opacity-50"
            >
              {busy ? '送信中…' : 'アクセスを開始する'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
