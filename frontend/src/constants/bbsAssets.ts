import bbsBeltLogoSrc from '@image/gatame_leranig_bletlogo.webp'
import kyukyuCardBgSrc from '@image/Kyukyu-image.webp'
import kyukyuCircleSrc from '@image/Kyukyu-image_Circle.webp'
import sankyuCardBgSrc from '@image/Sankyu-image.webp'
import sankyuCircleSrc from '@image/Sankyu-image_Circle.webp'

import type { BbsLevelKey } from './bbsOffers'

/** Black Belt System 汎用アイコン（`image/gatame_leranig_bletlogo.webp`） */
export const BBS_BELT_LOGO_SRC = bbsBeltLogoSrc

/** BBS 級別 円サムネイル（学習パス `BbsPathStepNode` 円内） */
export const BBS_LEVEL_CIRCLE_IMAGE_BY_LEVEL: Readonly<Partial<Record<BbsLevelKey, string>>> = {
  Kyukyu: kyukyuCircleSrc,
  Sankyu: sankyuCircleSrc,
}

/** BBS 級別 カード背景（学習パス premium カード） */
export const BBS_LEVEL_CARD_BACKGROUND_BY_LEVEL: Readonly<Partial<Record<BbsLevelKey, string>>> = {
  Kyukyu: kyukyuCardBgSrc,
  Sankyu: sankyuCardBgSrc,
}

export function getBbsLevelCircleImageSrc(level: BbsLevelKey): string | undefined {
  return BBS_LEVEL_CIRCLE_IMAGE_BY_LEVEL[level]
}

export function getBbsLevelCardBackgroundSrc(level: BbsLevelKey): string | undefined {
  return BBS_LEVEL_CARD_BACKGROUND_BY_LEVEL[level]
}
