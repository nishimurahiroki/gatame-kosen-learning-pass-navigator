import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { clearUserSyncQueue } from '../sync/syncService'
import { resolveAuthenticatedUserId } from '../utils/authVerify'

type AuthContextValue = {
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      // env 未設定: 認証は無効状態のまま停止し、上位（App.tsx）で env エラー画面に倒す
      setSession(null)
      setLoading(false)
      return
    }

    let mounted = true

    void (async () => {
      const { data: { session: initial } } = await supabase.auth.getSession()
      if (!mounted) return
      if (initial) {
        const verifiedId = await resolveAuthenticatedUserId()
        if (!mounted) return
        if (!verifiedId) {
          setSession(null)
        } else {
          setSession(initial.user.id === verifiedId ? initial : null)
        }
      } else {
        setSession(null)
      }
      setLoading(false)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    const uid = session?.user?.id
    if (uid) clearUserSyncQueue(uid)
    await supabase.auth.signOut()
  }, [session?.user?.id])

  const value = useMemo(
    () => ({ session, loading, signOut }),
    [session, loading, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
