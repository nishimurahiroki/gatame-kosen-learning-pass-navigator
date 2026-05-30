import en from '../locales/en.json'

/** Profile 用の相対時刻（英語） */
export function formatLastSaved(timestampMs: number, nowMs = Date.now()): string {
  const sec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000))
  if (sec < 60) return en.sync.profile.lastSavedJustNow
  const min = Math.floor(sec / 60)
  if (min < 60) {
    return en.sync.profile.lastSavedMinutes.replace('{n}', String(min))
  }
  const hours = Math.floor(min / 60)
  return en.sync.profile.lastSavedHours.replace('{n}', String(hours))
}
