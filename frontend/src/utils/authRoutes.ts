/** Magic Link 完了後・セッション検知後の遷移先 */
export const DASHBOARD_PATH = '/dashboard' as const

/** Kajabi 等からの会員導線（`AccessPage` が OTP 自動送信を担当） */
export const ACCESS_PATH = '/access' as const

export function isAccessPath(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.pathname === ACCESS_PATH
}

export function dashboardUrl(): string {
  if (typeof window === 'undefined') return DASHBOARD_PATH
  return `${window.location.origin}${DASHBOARD_PATH}`
}

export function redirectToDashboard(): void {
  if (typeof window === 'undefined') return
  if (window.location.pathname === DASHBOARD_PATH) return
  window.location.replace(DASHBOARD_PATH)
}
