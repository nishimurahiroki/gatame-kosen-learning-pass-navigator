/** Kajabi 等が渡しうるクエリ名（優先順） */
const EMAIL_QUERY_KEYS = ['email', 'member_email', 'e'] as const

function normalizeEmailParam(raw: string): string {
  let value = raw.trim()
  if (!value) return ''
  try {
    value = decodeURIComponent(value)
  } catch {
    /* 既にデコード済み */
  }
  return value.trim()
}

function isPlausibleEmail(value: string): boolean {
  if (!value || value.includes('{{') || value.includes('}}')) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

/** URL クエリからメールアドレスを読み取る（Kajabi の `?email=` 等） */
export function readEmailFromQuery(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  for (const key of EMAIL_QUERY_KEYS) {
    const raw = params.get(key)
    if (!raw) continue
    const normalized = normalizeEmailParam(raw)
    if (isPlausibleEmail(normalized)) return normalized
  }
  return null
}

/** 読み取り後にメール系クエリを URL から除去 */
export function stripEmailQueryParam(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  let changed = false
  for (const key of EMAIL_QUERY_KEYS) {
    if (params.has(key)) {
      params.delete(key)
      changed = true
    }
  }
  if (!changed) return
  const qs = params.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', next)
}
