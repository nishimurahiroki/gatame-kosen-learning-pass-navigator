import { Analytics } from '@vercel/analytics/react'
import { AnimatePresence, motion } from 'framer-motion'
import NavigatorApp from './NavigatorApp'
import AccessPage from './components/auth/AccessPage'
import AuthLoadingScreen from './components/auth/AuthLoadingScreen'
import ResetPasswordScreen from './components/auth/ResetPasswordScreen'
import TopPage from './components/TopPage'
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
  isTopPath,
  redirectToDiagnostic,
} from './utils/authRoutes'

function isResetPasswordPath() {
  return currentPathname() === '/reset-password'
}

function DiagnosticShell() {
  const { session } = useAuth()
  const inner = (
    <AnimatePresence mode="wait">
      <motion.div
        key="navigator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <NavigatorApp />
      </motion.div>
    </AnimatePresence>
  )

  const userId = session?.user?.id
  return (
    <SyncProvider userId={userId}>
      {userId ? <SyncStatusBanner /> : null}
      {inner}
    </SyncProvider>
  )
}

function AppGate() {
  const { session, loading } = useAuth()

  if (isResetPasswordPath()) {
    return <ResetPasswordScreen />
  }

  if (loading) {
    return <AuthLoadingScreen />
  }

  if (isAccessPath()) {
    if (session) {
      redirectToDiagnostic()
      return <AuthLoadingScreen />
    }
    return <AccessPage />
  }

  if (isTopPath()) {
    return <TopPage />
  }

  if (currentPathname() === DASHBOARD_PATH && session) {
    redirectToDiagnostic()
    return <AuthLoadingScreen />
  }

  if (isDiagnosticPath()) {
    return <DiagnosticShell />
  }

  if (session) {
    redirectToDiagnostic()
  } else {
    window.location.replace('/')
  }
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
