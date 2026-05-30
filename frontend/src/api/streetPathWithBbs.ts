import {
  BBS_LEVEL_DISPLAY_EN,
  BBS_MONTHLY_CHECKOUT_URL,
  BBS_ONE_TIME_CHECKOUT_URL,
  bbsLevelShowsMonthlyPlan,
  resolveBbsCheckoutLevelForEntryBanner,
  type BbsLevelKey,
} from '../constants/bbsOffers'
import type { ScoredModule } from '../types'
import { LEARNING_PATH_TECHNIQUE_COUNT } from './learningPathApi'

/** API が返す recommendedModules の先頭から生成パス 4 件を取得（finalScore > 0 が path 印）。 */
export function extractGeneratedPathModules(modules: ScoredModule[]): ScoredModule[] {
  const ranked = modules
    .filter((m) => m.finalScore > 0)
    .sort((a, b) => b.finalScore - a.finalScore)
  if (ranked.length >= LEARNING_PATH_TECHNIQUE_COUNT) {
    return ranked.slice(0, LEARNING_PATH_TECHNIQUE_COUNT)
  }
  return modules.slice(0, LEARNING_PATH_TECHNIQUE_COUNT)
}

/** Access Curriculum（Kajabi / 会員ログイン）— BBS ゲート共通 */
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
  /** 第 5 モジュール（BBS コンバージョンゲート・常時操作可） */
  isConversionGate: boolean
}

export type StreetPathItem =
  | { isBbsModule: false; module: ScoredModule }
  | { isBbsModule: true; bbs: BbsPromotionSlot }

function makeBbsConversionGate(args: {
  urlLevel: BbsLevelKey
}): BbsPromotionSlot {
  const { urlLevel } = args
  const levelName = BBS_LEVEL_DISPLAY_EN[urlLevel]

  const monthlyBase = BBS_MONTHLY_CHECKOUT_URL[urlLevel]
  const monthlyCheckoutUrl =
    bbsLevelShowsMonthlyPlan(urlLevel) && monthlyBase && monthlyBase.length > 0 ? monthlyBase : null

  const oneRaw = BBS_ONE_TIME_CHECKOUT_URL[urlLevel]
  const oneTimeCheckoutUrl =
    typeof oneRaw === 'string' && oneRaw.trim().length > 0 ? oneRaw.trim() : null

  return {
    id: 'bbs-conversion-gate',
    sequenceLevel: urlLevel,
    urlLevel,
    titleEn: `Black Belt System ${levelName}`,
    subtextEn: `Expert feedback to certify at ${levelName}.`,
    curriculumAccessUrl: BBS_CURRICULUM_ACCESS_URL,
    monthlyCheckoutUrl,
    oneTimeCheckoutUrl,
    isConversionGate: true,
  }
}

export type FourPlusOnePathOptions = {
  userAttribute: string
  recommendedBbsGrade?: string | null
  /** 診断 API が生成した 4 モジュール（省略時は recommendedModules から抽出） */
  pathModules?: ScoredModule[]
  pinnedModuleIds?: Iterable<string>
}

/**
 * specification.md §4 + README §2.3: 4 モジュール + 第 5（BBS ゲート）。
 */
export function buildFourPlusOnePath(
  modules: ScoredModule[],
  options: FourPlusOnePathOptions,
): StreetPathItem[] {
  let techniques = options.pathModules ?? extractGeneratedPathModules(modules)

  if (options.pinnedModuleIds) {
    const byId = new Map(modules.map((m) => [m.id, m]))
    const pinned: ScoredModule[] = []
    const pinnedSet = new Set<string>()
    for (const id of options.pinnedModuleIds) {
      if (pinnedSet.has(id)) continue
      const mod = byId.get(id)
      if (!mod) continue
      pinned.push(mod)
      pinnedSet.add(id)
    }
    const rest = techniques.filter((m) => !pinnedSet.has(m.id))
    techniques = [...pinned, ...rest].slice(0, LEARNING_PATH_TECHNIQUE_COUNT)
  }

  if (!techniques.length) return []

  const urlLevel = resolveBbsCheckoutLevelForEntryBanner(
    options.userAttribute,
    options.recommendedBbsGrade,
  )

  return [
    ...techniques.map((module) => ({ isBbsModule: false as const, module })),
    { isBbsModule: true as const, bbs: makeBbsConversionGate({ urlLevel }) },
  ]
}

/**
 * 4+1 パス上のモジュールが操作可能か。
 * 先頭のみカタログ前提（ukemi 等）。2 件目以降はパス上の直前モジュール完了で解放。
 */
export function prerequisitesMetOnLearningPath(
  pathItems: StreetPathItem[],
  moduleId: string,
  sessionCompletedIds: Set<string>,
  _catalogProgressIds: Set<string>,
  _userAttribute: string,
  policyLockedIds?: ReadonlySet<string>,
): boolean {
  const techniques = pathItems.filter((it) => !it.isBbsModule)
  const index = techniques.findIndex((it) => it.module.id === moduleId)
  if (index < 0) return true

  if (index === 0) {
    const head = techniques[0].module
    if (policyLockedIds?.has(head.id) || head.locked) return false
    // 生成パスの入口は常に開始可能（カタログ前提は診断選定時に反映済み）
    return true
  }
  return sessionCompletedIds.has(techniques[index - 1].module.id)
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

/** BBS コンバージョンゲートが操作可能か（常時解放）。 */
export function isBbsConversionGateUnlocked(pathItems: StreetPathItem[]): boolean {
  return pathItems.some((it) => it.isBbsModule && it.bbs.isConversionGate)
}
