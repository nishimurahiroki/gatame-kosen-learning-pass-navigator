import {
  BBS_LEVEL_SEQUENCE,
  BBS_LEVEL_DISPLAY_EN,
  BBS_MONTHLY_CHECKOUT_URL,
  BBS_ONE_TIME_CHECKOUT_URL,
  bbsLevelShowsMonthlyPlan,
  type BbsLevelKey,
} from '../constants/bbsOffers'
import type { ScoredModule } from '../types'
import {
  buildLearningStreetPathForPass,
  isNoviceUser,
  STREET_PASS_TECHNIQUE_MAX,
  type LearningStreetPathOptions,
} from './learningPathApi'

/** Access Curriculum（Kajabi / 会員ログイン）— 全 BBS マイルストーン共通 */
export const BBS_CURRICULUM_ACCESS_URL = 'https://www.kosenjudoonline.com/login'

export interface BbsPromotionSlot {
  id: string
  /** シーケンス上の級（表示・URL の両方に使用） */
  sequenceLevel: BbsLevelKey
  /** チェックアウト URL に使う級（sequenceLevel と一致） */
  urlLevel: BbsLevelKey
  titleEn: string
  subtextEn: string
  curriculumAccessUrl: string
  monthlyCheckoutUrl: string | null
  oneTimeCheckoutUrl: string | null
}

export type StreetPathItem =
  | { isBbsModule: false; module: ScoredModule }
  | { isBbsModule: true; bbs: BbsPromotionSlot }

function bbsInsertionInterval(userAttribute: string): number {
  if (isNoviceUser(userAttribute)) return 3
  if (userAttribute === 'Judo(白/初段)' || userAttribute === 'BJJ(白/青)') return 2
  if (userAttribute === 'Judo(二段以上)' || userAttribute === 'BJJ(紫以上)') return 1
  return 3
}

function makeBbsSlot(args: {
  slotIndex: number
  sequenceLevel: BbsLevelKey
  userAttribute: string
}): BbsPromotionSlot {
  const { slotIndex, sequenceLevel, userAttribute: _userAttribute } = args
  const urlLevel: BbsLevelKey = sequenceLevel

  const levelName = BBS_LEVEL_DISPLAY_EN[sequenceLevel]
  const titleEn = `Level Milestone: ${levelName}`
  const subtextEn = `You've reached the technical level for ${levelName}. Have you mastered these basics?`

  const monthlyBase = BBS_MONTHLY_CHECKOUT_URL[urlLevel]
  const monthlyCheckoutUrl =
    bbsLevelShowsMonthlyPlan(urlLevel) && monthlyBase && monthlyBase.length > 0 ? monthlyBase : null

  const oneRaw = BBS_ONE_TIME_CHECKOUT_URL[urlLevel]
  const oneTimeCheckoutUrl =
    typeof oneRaw === 'string' && oneRaw.trim().length > 0 ? oneRaw.trim() : null

  const curriculumAccessUrl = BBS_CURRICULUM_ACCESS_URL

  return {
    id: `bbs-offer:${slotIndex}`,
    sequenceLevel,
    urlLevel,
    titleEn,
    subtextEn,
    curriculumAccessUrl,
    monthlyCheckoutUrl,
    oneTimeCheckoutUrl,
  }
}

/**
 * 短い学習ストリートのテクニック列に、BBS 購入促進モジュールを規則どおり挿入する。
 * テクニック列は既定で {@link STREET_PASS_TECHNIQUE_MAX} 件（BBS はこの件数に含めない）。README §3.4。
 * `pinnedModuleIds` があるときは完了分を先頭に固定し、残りを buildLearningStreetPathForPass で未完了から選ぶ。
 * BBS 挿入間隔・開始級は `userAttribute` と `startBbsSequenceIndex`（未宣言の最初の級）に従う。
 *
 * `options.startBbsSequenceIndex` は `effectiveBbsSequenceStartIndex`（`completedBbsLevels` と
 * ユーザー属性に基づく）を渡す想定。初段まで完了済みで添字がシーケンス長と等しいときは
 * BBS ノードを挿入せず、テクニック列のみになる。
 */
export function buildStreetPathWithBbsOffers(
  modules: ScoredModule[],
  options: LearningStreetPathOptions & {
    userAttribute: string
    startBbsSequenceIndex?: number
  },
): StreetPathItem[] {
  const techniques = buildLearningStreetPathForPass(modules, options)
  if (!techniques.length) return []

  const interval = bbsInsertionInterval(options.userAttribute)
  const out: StreetPathItem[] = []
  let sequenceIndex = Math.min(
    Math.max(0, options.startBbsSequenceIndex ?? 0),
    BBS_LEVEL_SEQUENCE.length,
  )
  let countSinceBbs = 0
  let bbsSlotIndex = 0

  const appendBbs = () => {
    if (sequenceIndex >= BBS_LEVEL_SEQUENCE.length) return
    const sequenceLevel = BBS_LEVEL_SEQUENCE[sequenceIndex]
    sequenceIndex += 1
    out.push({
      isBbsModule: true,
      bbs: makeBbsSlot({
        slotIndex: bbsSlotIndex++,
        sequenceLevel,
        userAttribute: options.userAttribute,
      }),
    })
    countSinceBbs = 0
  }

  for (const module of techniques) {
    out.push({ isBbsModule: false, module })
    countSinceBbs += 1
    if (countSinceBbs >= interval && sequenceIndex < BBS_LEVEL_SEQUENCE.length) {
      appendBbs()
    }
  }

  while (sequenceIndex < BBS_LEVEL_SEQUENCE.length) {
    appendBbs()
  }

  return out
}

export function trailEdgeCleared(
  pathItems: StreetPathItem[],
  completedIds: Set<string>,
  sourceIndex: number,
): boolean {
  const source = pathItems[sourceIndex]
  if (!source) return false
  if (!source.isBbsModule) {
    return completedIds.has(source.module.id)
  }
  for (let j = sourceIndex - 1; j >= 0; j--) {
    const it = pathItems[j]
    if (!it.isBbsModule) return completedIds.has(it.module.id)
  }
  return true
}

/**
 * `completedBbsLevels`（合格宣言済み級）を踏まえ、シーケンス上 `fromIndex` 以降で
 * まだ宣言されていない最初の級の添字を返す。該当なし（例: 下限〜初段まですべて完了）なら
 * `BBS_LEVEL_SEQUENCE.length`。
 */
export function firstUndeclaredBbsSequenceIndexFrom(
  declaredLevels: Set<BbsLevelKey>,
  fromIndex: number,
): number {
  const start = Math.min(Math.max(0, fromIndex), BBS_LEVEL_SEQUENCE.length)
  for (let i = start; i < BBS_LEVEL_SEQUENCE.length; i++) {
    const lv = BBS_LEVEL_SEQUENCE[i]
    if (!declaredLevels.has(lv)) return i
  }
  return BBS_LEVEL_SEQUENCE.length
}

/**
 * 学習パス上で最初に提示する BBS 級のシーケンス添字の下限。
 * 未経験者は Kyukyu（0）から、経験者・熟練者は Sankyu から（`isNoviceUser` と同一判定）。
 */
export function bbsEntrySequenceFloorForUser(userAttribute: string): number {
  if (isNoviceUser(userAttribute)) return 0
  const sankyuIdx = BBS_LEVEL_SEQUENCE.indexOf('Sankyu')
  return sankyuIdx >= 0 ? sankyuIdx : 0
}

/**
 * パス構築用 `startBbsSequenceIndex`。
 * ユーザーのエントリ下限（級）から見て、`completedBbsLevels` にまだ無い最初の級を
 * 「新しいパスの最初の BBS 挿入ポイント」とする。初段まで宣言済みなら挿入なし（長さを返す）。
 */
export function effectiveBbsSequenceStartIndex(
  userAttribute: string,
  declaredLevels: Set<BbsLevelKey>,
): number {
  const floor = bbsEntrySequenceFloorForUser(userAttribute)
  return firstUndeclaredBbsSequenceIndexFrom(declaredLevels, floor)
}
