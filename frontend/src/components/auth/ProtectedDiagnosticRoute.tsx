import { useEffect, useState, type ReactNode } from 'react'
import AuthLoadingScreen from './AuthLoadingScreen'
import { useAuth } from '../../context/AuthContext'
import { redirectToAccess } from '../../utils/authRoutes'
import { resolveAuthenticatedUserId } from '../../utils/authVerify'
import { supabase } from '../../utils/supabaseClient'

/**
 * 診断画面用 Auth Guard。
 * マウント時に getSession / getUser で認証を確認し、未ログインなら /access へ送る。
 */
export default function ProtectedDiagnosticRoute({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth()
  const [guardReady, setGuardReady] = useState(false)

  useEffect(() => {
    const client = supabase
    if (!client) {
      setGuardReady(true)
      return
    }

    let mounted = true

    const verify = async () => {
      const { data: { session: initial } } = await client.auth.getSession()
      if (!mounted) return

      if (!initial) {
        redirectToAccess()
        return
      }

      const userId = await resolveAuthenticatedUserId()
      if (!mounted) return

      if (!userId) {
        redirectToAccess()
        return
      }

      setGuardReady(true)
    }

    void verify()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!nextSession) {
        redirectToAccess()
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !session && guardReady) {
      redirectToAccess()
    }
  }, [authLoading, session, guardReady])

  if (authLoading || !guardReady || !session) {
    return <AuthLoadingScreen />
  }

  return <>{children}</>
}
