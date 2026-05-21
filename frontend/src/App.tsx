import { Analytics } from '@vercel/analytics/react'
import { AnimatePresence, motion } from 'framer-motion'
import NavigatorApp from './NavigatorApp'
import AccessPage from './components/auth/AccessPage'
import AuthLoadingScreen from './components/auth/AuthLoadingScreen'
import ProtectedDiagnosticRoute from './components/auth/ProtectedDiagnosticRoute'
import ResetPasswordScreen from './components/auth/ResetPasswordScreen'
import EnvErrorScreen from './components/common/EnvErrorScreen'
import SyncStatusBanner from './components/common/SyncStatusBanner'
import { ToastHost } from './components/common/Toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SyncProvider } from './context/SyncContext'
import { isSupabaseConfigured, missingSupabaseEnvKeys } from './lib/supabase'
import {
  currentPathname,
  DASHBOARD_PATH,
  isAccessPath,
  isDiagnosticPath,
  redirectToAccess,
  redirectToDiagnostic,
} from './utils/authRoutes'

function isResetPasswordPath() {
  return currentPathname() === '/reset-password'
}

function AppGate() {
  const { session, loading } = useAuth()
  const path = currentPathname()

  if (isResetPasswordPath()) {
    return <ResetPasswordScreen />
  }

  if (loading) {
    return <AuthLoadingScreen />
  }

  // 会員アクセス（公開）
  if (isAccessPath()) {
    if (session) {
      redirectToDiagnostic()
      return <AuthLoadingScreen />
    }
    return <AccessPage />
  }

  // ルート: 未ログイン → /access（Kajabi の ?email= を維持）、ログイン済み → /diagnostic
  if (path === '/') {
    if (session) {
      redirectToDiagnostic()
    } else {
      redirectToAccess(true)
    }
    return <AuthLoadingScreen />
  }

  // 旧 URL /dashboard → /diagnostic
  if (path === DASHBOARD_PATH && session) {
    redirectToDiagnostic()
    return <AuthLoadingScreen />
  }

  // 診断画面（保護ルート）
  if (isDiagnosticPath()) {
    if (!session) {
      redirectToAccess(true)
      return <AuthLoadingScreen />
    }

    return (
      <ProtectedDiagnosticRoute>
        <AnimatePresence mode="wait">
          <motion.div
            key="navigator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <SyncProvider userId={session.user.id}>
              <SyncStatusBanner />
              <NavigatorApp />
            </SyncProvider>
          </motion.div>
        </AnimatePresence>
      </ProtectedDiagnosticRoute>
    )
  }

  // その他のパス: 未ログインは /access、ログイン済みは /diagnostic
  if (!session) {
    redirectToAccess(true)
    return <AuthLoadingScreen />
  }

  redirectToDiagnostic()
  return <AuthLoadingScreen />
}

export default function App() {
  return (
    <>
      {!isSupabaseConfigured ? (
        <EnvErrorScreen missingKeys={missingSupabaseEnvKeys} />
      ) : (
        <AuthProvider>
          <AppGate />
          <ToastHost />
        </AuthProvider>
      )}
      <Analytics />
    </>
  )
}
