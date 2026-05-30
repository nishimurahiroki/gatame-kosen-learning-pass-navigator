import { useState } from 'react'

import { getBbsLevelCircleImageSrc } from '../../constants/bbsAssets'
import type { BbsLevelKey } from '../../constants/bbsOffers'
import CircleCoverImage, { circleCoverImageStyle } from './CircleCoverImage'
import BbsBeltLogo from './BbsBeltLogo'

type BbsLevelCircleImageProps = {
  level: BbsLevelKey
  size?: number
  fill?: boolean
  className?: string
  alt?: string
}

/** Kyukyu / Sankyu は級別円画像。それ以外はベルトロゴにフォールバック。 */
export default function BbsLevelCircleImage({
  level,
  size,
  fill = false,
  className = '',
  alt = '',
}: BbsLevelCircleImageProps) {
  const [broken, setBroken] = useState(false)
  const src = getBbsLevelCircleImageSrc(level)

  if (!src || broken) {
    if (fill) {
      return (
        <span className={`absolute inset-0 flex items-center justify-center ${className}`.trim()}>
          <BbsBeltLogo size={size ?? 48} className="max-h-[58%] max-w-[58%] object-contain" alt={alt} />
        </span>
      )
    }
    return <BbsBeltLogo size={size ?? 48} className={className} alt={alt} />
  }

  if (fill) {
    return (
      <CircleCoverImage
        src={src}
        className={className}
        alt={alt}
        onError={() => setBroken(true)}
      />
    )
  }

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt}
        className="absolute object-cover"
        style={circleCoverImageStyle()}
        draggable={false}
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </span>
  )
}
