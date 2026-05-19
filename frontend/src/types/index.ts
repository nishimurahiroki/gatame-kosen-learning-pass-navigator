// ── 診断（バックエンド Assessment API と同期）───────────────────────────────

export type InterestOrientation = 'JUDO' | 'BJJ' | 'MIX'

/** Q1 セグメント（5択）→ API userAttribute 文言へマップ */
export type UserSegment =
  | 'NOVICE'
  | 'JUDO_BEGINNER'
  | 'BJJ_BEGINNER'
  | 'JUDO_ADVANCED'
  | 'BJJ_ADVANCED'

/** @deprecated 旧フォーム互換。新ウィザードでは UserSegment を使用 */
export type UserType = 'BEGINNER' | 'JUDO' | 'BJJ' | 'ADVANCED'

/** Q1 → バックエンドが期待する日本語ラベル */
export const USER_SEGMENT_TO_ATTRIBUTE: Record<UserSegment, string> = {
  NOVICE: '未経験',
  JUDO_BEGINNER: 'Judo(白/初段)',
  BJJ_BEGINNER: 'BJJ(白/青)',
  JUDO_ADVANCED: 'Judo(二段以上)',
  BJJ_ADVANCED: 'BJJ(紫以上)',
}

/** Step 1 の選択値 → API の userAttribute 文言へ（レガシー） */
export const USER_TYPE_TO_ATTRIBUTE_API: Record<UserType, string> = {
  BEGINNER: '未経験',
  JUDO: 'Judo(白/初段)',
  BJJ: 'BJJ(白/青)',
  ADVANCED: 'Judo(二段以上)',
}

/** 未経験者向け憧れスタイル（バックエンド AspirationStyle の JSON ラベルと一致） */
export type AspirationStyleLabel =
  | '投げたい'
  | '極めたい'
  | '抑え込み（Judo）'
  | '連動性（Mix）'

/** 最終ゴール Q5（バックエンド FinalGoal のラベルと一致） */
export type FinalGoalLabel =
  | '課題解決'
  | 'BBS取得（黒帯を目指す）'
  | '技術補完'
  | '指導参考'

/** POST /api/assessment のペイロード */
export interface AssessmentRequest {
  userAttribute: string
  /** 経験者向け Q2。未経験者では省略可。 */
  interests?: InterestOrientation | null
  /** 課題 A〜G（複数可） */
  problems: string[]
  /** 未経験者向け Q2-alt（複数可） */
  aspirations?: AspirationStyleLabel[] | string[]
  /** Q5（スコアには影響しない） */
  finalGoal?: FinalGoalLabel | string | null
  completedModuleIds?: string[]
  userId?: string
}

/** modules.json の課題ID → 診断の課題文字（application.yml の A〜G と一致） */
export const PROBLEM_ID_TO_LETTER: Record<string, string> = {
  'standing-flow-to-submission': 'A',
  'pin-after-throw': 'B',
  'turtle-breakdown': 'C',
  'guard-pass-from-top': 'D',
  'guard-bottom-sweep-submit': 'E',
  'grip-fight': 'F',
  'escape-osaekomi': 'G',
}

/** Q3 表示用（文言は locales/en.json。id は API マッピング用） */
export interface PainPointOption {
  id: string
  headline: string
  scenario: string
  icon: string
}

import { PAIN_POINT_OPTIONS } from '../locales/painPoints'

export { PAIN_POINT_OPTIONS }

export function bbsThresholdForAttribute(attr: string): number {
  switch (attr) {
    case 'Judo(二段以上)':
    case 'BJJ(紫以上)':
      return 1
    default:
      return 3
  }
}

// ── 難易度レベル ──────────────────────────────────────────────────────

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

// ── APIレスポンス ─────────────────────────────────────────────────────

export interface ScoreBreakdown {
  baseScore: number
  userAttributeBonus: number
  orientationBonus: number
  aspirationBonus: number
  problemMatchBonus: number
  prerequisitePenalty: number
}

export interface ScoredModule {
  id: string
  name: string
  difficulty: DifficultyLevel
  description: string
  videoUrl: string
  thumbnailUrl: string
  prerequisites: string[]
  finalScore: number
  scoreBreakdown: ScoreBreakdown
  locked: boolean
}

export interface AssessmentResponse {
  userAttribute: string
  interests?: InterestOrientation | null
  aspirations: string[]
  finalGoal?: string | null
  suggestBBSEarly?: boolean
  /** Server-driven Y offset (px) per module for skill map layout; positive pushes node downward. */
  layoutPullByModuleId?: Record<string, number>
  recommendedModules: ScoredModule[]
  totalModules: number
  showBbsPromotion: boolean
  recommendedBbsGrade: string
}

export type LearningPathResponse = AssessmentResponse
