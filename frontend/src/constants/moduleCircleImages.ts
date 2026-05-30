import ukemiSrc from '@image/Ukemi.webp'
import soloNewazaWorkoutSrc from '@image/Solo Newaza workout_Circle.webp'
import osaekomiSrc from '@image/Osae-komi_Circle.webp'
import fundamentalTachiWazaSrc from '@image/Fundmental Tachi-waza_Circle.webp'
import kumikataAiYotsuSrc from '@image/Kumikata in Aiyotsu_Circle.webp'
import kumikataKenkaYotsuSrc from '@image/Kumikata in Kenkayotsu_Circle.webp'
import breakGrippingAiYotsuSrc from '@image/Breaking the gripping in Aiyotsu_Circle.webp'
import breakGrippingKenkaYotsuSrc from '@image/Breaking the Grip in Kenkayotsu_Circle.webp'
import kansetsuWazaSrc from '@image/Kansetsu-waza_Circle.webp'
import shimeWazaSrc from '@image/Shime-waza_Circle.webp'
import throwingSrc from '@image/Throwing_Circle.webp'
import guardPassTopSrc from '@image/Guard pass on the top_Circle.webp'
import guardPassBottomSrc from '@image/Guard Position on the Bottom_Circle.webp'
import onTheTurtleSrc from '@image/On the turtle_Circle.webp'
import escapeFromOsaekomiSrc from '@image/Kesa-gatame escape_Circle.webp'
import shimeWazaTransitionSrc from '@image/Transiton Shime-waza_Circle.webp'
import kansetsuWazaTransitionSrc from '@image/transition Kansetsu-waza_Circle.webp'
import osaekomiTransitionSrc from '@image/Transiton Osaekomi_Circle.webp'

/** 学習パス `PathStepNode` 円内サムネイル（`image/` 配下。Vite alias `@image`） */
export const MODULE_CIRCLE_IMAGE_BY_ID: Readonly<Record<string, string>> = {
  ukemi: ukemiSrc,
  'solo-newaza-workout': soloNewazaWorkoutSrc,
  osaekomi: osaekomiSrc,
  'fundamental-tachi-waza': fundamentalTachiWazaSrc,
  'kumikata-ai-yotsu': kumikataAiYotsuSrc,
  'kumikata-kenka-yotsu': kumikataKenkaYotsuSrc,
  'break-gripping-ai-yotsu': breakGrippingAiYotsuSrc,
  'break-gripping-kenka-yotsu': breakGrippingKenkaYotsuSrc,
  'kansetsu-waza': kansetsuWazaSrc,
  'shime-waza': shimeWazaSrc,
  throwing: throwingSrc,
  'guard-pass-top': guardPassTopSrc,
  'guard-pass-bottom': guardPassBottomSrc,
  'on-the-turtle': onTheTurtleSrc,
  'escape-from-osaekomi': escapeFromOsaekomiSrc,
  'shime-waza-transition': shimeWazaTransitionSrc,
  'kansetsu-waza-transition': kansetsuWazaTransitionSrc,
  'osaekomi-transition': osaekomiTransitionSrc,
}

/** 円サムネイルの一律拡大率（淵余白の裁ち切り） */
export const MODULE_CIRCLE_IMAGE_SCALE = 1.3

/**
 * 個別調整が必要なモジュールのみ（`image/` 内容重心解析 → 写真中心 %）。
 * `CircleCoverImage` が 16:9 cover 向け object-position に変換する。
 */
export const MODULE_CIRCLE_CONTENT_ANCHOR_BY_ID: Readonly<Partial<Record<string, string>>> = {
  /** Ukemi.webp — 写真中心 ≈ 31.5% → object-position ≈ 8% */
  ukemi: '31.5% 50%',
  /** Kesa-gatame escape_Circle.webp — 写真中心 ≈ 67.2% → object-position ≈ 89% */
  'escape-from-osaekomi': '67.2% 50%',
}

export function getModuleCircleImageSrc(moduleId: string): string | undefined {
  return MODULE_CIRCLE_IMAGE_BY_ID[moduleId]
}

export function getModuleCircleContentAnchor(moduleId: string): string | undefined {
  return MODULE_CIRCLE_CONTENT_ANCHOR_BY_ID[moduleId]
}
