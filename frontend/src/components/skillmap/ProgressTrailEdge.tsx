import { BaseEdge, type EdgeProps, type Position } from 'reactflow'

export type TrailVariant = 'cleared' | 'locked'

export interface ProgressTrailEdgeData {
  variant: TrailVariant
}

function buildTrailPath(args: {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition?: Position
  targetPosition?: Position
}): string {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = args

  // 横移動（すごろく同一行）: まず水平に出してから必要なら縦調整
  if (sourcePosition === 'right' || sourcePosition === 'left') {
    return `M ${sourceX} ${sourceY} L ${targetX} ${sourceY} L ${targetX} ${targetY}`
  }

  // 折り返し（下段へ）: 必ず「下に降りてから横へ」つなぐ
  if (sourcePosition === 'bottom' && (targetPosition === 'left' || targetPosition === 'right')) {
    return `M ${sourceX} ${sourceY} L ${sourceX} ${targetY} L ${targetX} ${targetY}`
  }

  // モバイル縦並びなど
  return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
}

function trailStyle(variant: TrailVariant): {
  stroke: string
  strokeWidth: number
  strokeDasharray?: string
  opacity: number
} {
  switch (variant) {
    case 'cleared':
      return {
        stroke: '#c5a059',
        strokeWidth: 5.5,
        opacity: 0.95,
      }
    default:
      return {
        stroke: 'rgba(51, 65, 85, 0.95)',
        strokeWidth: 2.5,
        strokeDasharray: '10 14',
        opacity: 0.72,
      }
  }
}

export default function ProgressTrailEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const path = buildTrailPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const variant = (data as ProgressTrailEdgeData | undefined)?.variant ?? 'locked'
  const s = trailStyle(variant)

  return (
    <>
      {variant === 'cleared' ? (
        <path
          d={path}
          fill="none"
          stroke="rgba(197,160,89,0.22)"
          strokeWidth={12}
          strokeLinecap="round"
          className="pointer-events-none"
        />
      ) : null}
      <g className={variant === 'cleared' ? 'path-trail-edge-cleared' : undefined}>
        <BaseEdge
          id={id}
          path={path}
          style={{
            stroke: s.stroke,
            strokeWidth: s.strokeWidth,
            strokeDasharray: s.strokeDasharray,
            strokeLinecap: 'round',
            opacity: s.opacity,
          }}
        />
      </g>
    </>
  )
}
