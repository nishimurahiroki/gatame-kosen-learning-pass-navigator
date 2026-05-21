/** URL クエリ `?email=` を読み取り、簡易バリデーション後に返す */
export function readEmailFromQuery(): string | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get('email')
  if (!raw) return null
  const trimmed = decodeURIComponent(raw).trim()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  return trimmed
}

/** 読み取り後に `email` クエリを URL から除去 */
export function stripEmailQueryParam(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('email')) return
  params.delete('email')
  const qs = params.toString()
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', next)
}
