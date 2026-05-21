import { Analytics } from '@vercel/analytics/react'
import { AnimatePresence, motion } from 'framer-motion'
import NavigatorApp from './NavigatorApp'
import AuthLoadingScreen from './components/auth/AuthLoadingScreen'
import LoginScreen from './components/auth/LoginScreen'
import ResetPasswordScreen from './components/auth/ResetPasswordScreen'
import EnvErrorScreen from './components/common/EnvErrorScreen'
import SyncStatusBanner from './components/common/SyncStatusBanner'
import { ToastHost } from './components/common/Toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SyncProvider } from './context/SyncContext'
import { isSupabaseConfigured, missingSupabaseEnvKeys } from './lib/supabase'

function isResetPasswordPath() {
  if (typeof window === 'undefined') return false
  return window.location.pathname === '/reset-password'
}

function AppGate() {
  const { session, loading } = useAuth()

  if (isResetPasswordPath()) {
    return <ResetPasswordScreen />
  }

  if (loading) {
    return <AuthLoadingScreen />
  }

  return (
    <AnimatePresence mode="wait">
      {!session ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <LoginScreen />
        </motion.div>
      ) : (
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
      )}
    </AnimatePresence>
  )
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
