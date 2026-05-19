export const ANNUAL_MEMBERSHIP_PURCHASED_STORAGE_KEY = 'gatame.annual-membership-purchased.v1'
const PURCHASED_KEY = ANNUAL_MEMBERSHIP_PURCHASED_STORAGE_KEY

const DISMISSED_AT_KEY = 'gatame.annual-membership-dismissed-at.v1'

/** 「Not now」を押した後に再度プロモを出さないクールダウン（24 時間）。 */
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000

export function loadAnnualMembershipPurchased(): boolean {
  try {
    return localStorage.getItem(PURCHASED_KEY) === '1'
  } catch {
    return false
  }
}

export function saveAnnualMembershipPurchased(): void {
  try {
    localStorage.setItem(PURCHASED_KEY, '1')
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent('gatame-annual-membership-changed'))
  } catch {
    /* ignore */
  }
}

/** 直近の「Not now」操作からクールダウン中なら true を返す。 */
export function isAnnualMembershipPromoOnCooldown(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_AT_KEY)
    if (!raw) return false
    const at = Number(raw)
    if (!Number.isFinite(at) || at <= 0) return false
    return Date.now() - at < DISMISS_COOLDOWN_MS
  } catch {
    return false
  }
}

/** ユーザーが「Not now」を押下したことを記録（24h プロモ抑止）。 */
export function markAnnualMembershipPromoDismissed(): void {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
}
