import type { CSSProperties } from 'react'

import { MODULE_CIRCLE_IMAGE_SCALE } from '../../constants/moduleCircleImages'

/** モジュール円画像は 16:9 前提（3840×2160 等） */
const LANDSCAPE_ASPECT_W = 16
const LANDSCAPE_ASPECT_H = 9

type CircleCoverImageProps = {
  src: string
  scale?: number
  /** ソース画像内の写真中心 %（例: `32% 50%`）。16:9 cover 向けに object-position へ変換 */
  contentAnchor?: string
  className?: string
  alt?: string
  onError?: () => void
}

function parseAnchor(anchor: string): [number, number] {
  const [xRaw, yRaw] = anchor.trim().split(/\s+/)
  return [parseFloat(xRaw), parseFloat(yRaw)]
}

/**
 * object-fit:cover（正方形）で 16:9 画像の焦点 cx% を円中心に合わせる object-position。
 * cx% をそのまま object-position に使うと誤る（cover 時の % は切り出し位置）。
 */
export function contentAnchorToObjectPosition(contentAnchor: string): string {
  const [cx, cy] = parseAnchor(contentAnchor)
  const visWRatio = LANDSCAPE_ASPECT_H / LANDSCAPE_ASPECT_W
  const maxLeftRatio = 1 - visWRatio
  const targetLeftRatio = cx / 100 - visWRatio / 2
  const objectPosX = Math.max(0, Math.min(100, (targetLeftRatio / maxLeftRatio) * 100))
  return `${objectPosX.toFixed(1)}% ${cy}%`
}

function buildCircleCoverStyle(scale: number, contentAnchor?: string): CSSProperties {
  const objectPosition = contentAnchor
    ? contentAnchorToObjectPosition(contentAnchor)
    : '50% 50%'

  return {
    width: `${scale * 100}%`,
    height: `${scale * 100}%`,
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    objectFit: 'cover',
    objectPosition,
    maxWidth: 'none',
  }
}

/** 円コンテナ内で拡大表示 */
export default function CircleCoverImage({
  src,
  scale = MODULE_CIRCLE_IMAGE_SCALE,
  contentAnchor,
  className = '',
  alt = '',
  onError,
}: CircleCoverImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`absolute object-cover ${className}`.trim()}
      style={buildCircleCoverStyle(scale, contentAnchor)}
      draggable={false}
      loading="lazy"
      onError={onError}
    />
  )
}

export function circleCoverImageStyle(
  scale = MODULE_CIRCLE_IMAGE_SCALE,
  contentAnchor?: string,
): CSSProperties {
  return buildCircleCoverStyle(scale, contentAnchor)
}
