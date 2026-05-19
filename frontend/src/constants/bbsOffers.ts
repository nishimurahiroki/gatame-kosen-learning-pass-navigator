/**
 * BBS（Black Belt System）の級シーケンスと表示用定数。
 *
 * チェックアウト URL の変更は `src/config/bbsCheckoutUrls.json` のみ編集してください（再ビルドで反映）。
 */
import checkoutUrls from '../config/bbsCheckoutUrls.json'

export const BBS_LEVEL_SEQUENCE = [
  'Kyukyu',
  'Hachikyu',
  'Nanakyu',
  'Rokukyu',
  'Gokyu',
  'Yonkyu',
  'Sankyu',
  'Nikyu',
  'Ikkyu',
  'Shodan',
] as const

export type BbsLevelKey = (typeof BBS_LEVEL_SEQUENCE)[number]

/** UI 表示用（英語ランク名） */
export const BBS_LEVEL_DISPLAY_EN: Record<BbsLevelKey, string> = {
  Kyukyu: 'Kyukyu',
  Hachikyu: 'Hachikyu',
  Nanakyu: 'Nanakyu',
  Rokukyu: 'Rokukyu',
  Gokyu: 'Gokyu',
  Yonkyu: 'Yonkyu',
  Sankyu: 'Sankyu',
  Nikyu: 'Nikyu',
  Ikkyu: 'Ikkyu',
  Shodan: 'Shodan',
}

type CheckoutJson = {
  monthly?: Record<string, string | undefined>
  oneTime?: Record<string, string | undefined>
}

const checkout = checkoutUrls as CheckoutJson

function trimUrl(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** Monthly（JSON の `monthly` を参照。Kyukyu / Sankyu のみ UI で使用） */
export const BBS_MONTHLY_CHECKOUT_URL: Partial<Record<BbsLevelKey, string>> = (() => {
  const src = checkout.monthly ?? {}
  const out: Partial<Record<BbsLevelKey, string>> = {}
  for (const key of BBS_LEVEL_SEQUENCE) {
    const u = trimUrl(src[key])
    if (u) out[key] = u
  }
  return out
})()

/** One-time（JSON の `oneTime` を参照。級キーは BBS_LEVEL_SEQUENCE と一致させる） */
export const BBS_ONE_TIME_CHECKOUT_URL: Record<BbsLevelKey, string> = (() => {
  const src = checkout.oneTime ?? {}
  const out = {} as Record<BbsLevelKey, string>
  for (const key of BBS_LEVEL_SEQUENCE) {
    out[key] = trimUrl(src[key])
  }
  return out
})()

export function bbsLevelShowsMonthlyPlan(level: BbsLevelKey): boolean {
  return level === 'Kyukyu' || level === 'Sankyu'
}

/** 八級以降の級。Monthly 会員向け「ワンタイム不要」リマインダーを出す対象（九級のみ除外）。 */
export function bbsLevelShowsMonthlyPlanPurchaserReminder(level: BbsLevelKey): boolean {
  const idx = BBS_LEVEL_SEQUENCE.indexOf(level)
  return idx >= 1
}

/**
 * 診断直後バナー用のチェックアウト級（バックエンド {@code recommendedBbsGrade} と同期）。
 * 未対応の表記のときは userAttribute に合わせ九級相当 / 三級相当へフォールバックする。
 */
export function resolveBbsCheckoutLevelForEntryBanner(
  userAttribute: string,
  recommendedBbsGrade: string | null | undefined,
): BbsLevelKey {
  const g = (recommendedBbsGrade ?? '').trim()
  if (g === '九級') return 'Kyukyu'
  if (g === '三級') return 'Sankyu'
  return userAttribute === '未経験' ? 'Kyukyu' : 'Sankyu'
}

/** バナー用 One-time URL（空なら null） */
export function bbsCheckoutUrlOneTimeOrNull(level: BbsLevelKey): string | null {
  const u = (BBS_ONE_TIME_CHECKOUT_URL[level] ?? '').trim()
  return u.length > 0 ? u : null
}

/** バナー用 Monthly URL（Kyukyu/Sankyu のみ。空なら null） */
export function bbsCheckoutUrlMonthlyOrNull(level: BbsLevelKey): string | null {
  if (!bbsLevelShowsMonthlyPlan(level)) return null
  const u = (BBS_MONTHLY_CHECKOUT_URL[level] ?? '').trim()
  return u.length > 0 ? u : null
}
