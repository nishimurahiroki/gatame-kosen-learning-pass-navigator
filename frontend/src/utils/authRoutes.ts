/** 診断・学習パス（要ログイン） */
export const DIAGNOSTIC_PATH = '/diagnostic' as const

/** 旧 Magic Link 用（`/diagnostic` へリダイレクト） */
export const DASHBOARD_PATH = '/dashboard' as const

/** Kajabi / 会員アクセス（未ログインの入り口） */
export const ACCESS_PATH = '/access' as const

/** 本番 Magic Link のリダイレクト先（Supabase Redirect URLs に登録） */
export const PRODUCTION_MAGIC_LINK_REDIRECT =
  'https://gatame-kosen-learning-pass-navigato.vercel.app/diagnostic' as const

export function currentPathname(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname
}

export function isAccessPath(): boolean {
  return currentPathname() === ACCESS_PATH
}

export function isDiagnosticPath(): boolean {
  const path = currentPathname()
  return path === DIAGNOSTIC_PATH || path === DASHBOARD_PATH
}

/** 診断アプリ本体（要認証）のパスか */
export function isProtectedAppPath(): boolean {
  const path = currentPathname()
  return path === '/' || isDiagnosticPath()
}

export function diagnosticUrl(): string {
  if (typeof window === 'undefined') return DIAGNOSTIC_PATH
  return `${window.location.origin}${DIAGNOSTIC_PATH}`
}

/** OTP メール内リンクの遷移先 */
export function magicLinkRedirectTo(): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}${DIAGNOSTIC_PATH}`
  }
  return PRODUCTION_MAGIC_LINK_REDIRECT
}

export function redirectToDiagnostic(): void {
  if (typeof window === 'undefined') return
  if (currentPathname() === DIAGNOSTIC_PATH) return
  window.location.replace(DIAGNOSTIC_PATH)
}

/** 未ログイン時の入り口へ（`?email=` 等のクエリを維持） */
export function redirectToAccess(preserveSearch = true): void {
  if (typeof window === 'undefined') return
  if (currentPathname() === ACCESS_PATH) return
  const qs = preserveSearch ? window.location.search : ''
  window.location.replace(`${ACCESS_PATH}${qs}`)
}

/** @deprecated Use redirectToDiagnostic */
export function redirectToDashboard(): void {
  redirectToDiagnostic()
}

export function dashboardUrl(): string {
  return diagnosticUrl()
}
