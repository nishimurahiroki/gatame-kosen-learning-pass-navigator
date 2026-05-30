import { Handle, Position } from 'reactflow'

/** React Flow エッジ接続用ハンドル ID（PathStep / BbsPath 共通） */
export const PATH_TRAIL_HANDLE = {
  targetTop: 'target-top',
  targetLeft: 'target-left',
  targetRight: 'target-right',
  sourceBottom: 'source-bottom',
  sourceLeft: 'source-left',
  sourceRight: 'source-right',
} as const

const handleClass = '!h-2 !w-2 !border-0 !bg-transparent !opacity-0'

/** 円形アイコン中央の高さに左右ハンドルを揃える */
function circleHandleTop(nodeBox: number): number {
  return Math.round(nodeBox / 2)
}

/** モジュール円周上の入出力ハンドル（上下左右） */
export function PathTrailHandles({ nodeBox }: { nodeBox: number }) {
  const top = circleHandleTop(nodeBox)
  return (
    <>
      <Handle
        type="target"
        id={PATH_TRAIL_HANDLE.targetTop}
        position={Position.Top}
        className={handleClass}
      />
      <Handle
        type="target"
        id={PATH_TRAIL_HANDLE.targetLeft}
        position={Position.Left}
        style={{ top }}
        className={handleClass}
      />
      <Handle
        type="target"
        id={PATH_TRAIL_HANDLE.targetRight}
        position={Position.Right}
        style={{ top }}
        className={handleClass}
      />
      <Handle
        type="source"
        id={PATH_TRAIL_HANDLE.sourceBottom}
        position={Position.Bottom}
        className={handleClass}
      />
      <Handle
        type="source"
        id={PATH_TRAIL_HANDLE.sourceLeft}
        position={Position.Left}
        style={{ top }}
        className={handleClass}
      />
      <Handle
        type="source"
        id={PATH_TRAIL_HANDLE.sourceRight}
        position={Position.Right}
        style={{ top }}
        className={handleClass}
      />
    </>
  )
}

export function resolveTrailHandles(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  layout: { outerWidth: number; nodeBox: number },
  isWide: boolean,
): { sourceHandle: string; targetHandle: string } {
  if (!isWide) {
    return {
      sourceHandle: PATH_TRAIL_HANDLE.sourceBottom,
      targetHandle: PATH_TRAIL_HANDLE.targetTop,
    }
  }

  const sourceCx = sourcePos.x + layout.outerWidth / 2
  const sourceCy = sourcePos.y + layout.nodeBox / 2
  const targetCx = targetPos.x + layout.outerWidth / 2
  const targetCy = targetPos.y + layout.nodeBox / 2
  const dx = targetCx - sourceCx
  const dy = targetCy - sourceCy

  // 行の折り返しなど「下段へ進む」ケースは、必ずモジュール下から出す。
  // これで線の途中から分岐して見える崩れを防ぐ。
  if (dy > layout.nodeBox * 0.45) {
    return {
      sourceHandle: PATH_TRAIL_HANDLE.sourceBottom,
      targetHandle: dx >= 0 ? PATH_TRAIL_HANDLE.targetLeft : PATH_TRAIL_HANDLE.targetRight,
    }
  }

  if (Math.abs(dx) > Math.abs(dy) * 0.55) {
    if (dx > 0) {
      return {
        sourceHandle: PATH_TRAIL_HANDLE.sourceRight,
        targetHandle: PATH_TRAIL_HANDLE.targetLeft,
      }
    }
    return {
      sourceHandle: PATH_TRAIL_HANDLE.sourceLeft,
      targetHandle: PATH_TRAIL_HANDLE.targetRight,
    }
  }

  return {
    sourceHandle: PATH_TRAIL_HANDLE.sourceBottom,
    targetHandle: dx >= 0 ? PATH_TRAIL_HANDLE.targetLeft : PATH_TRAIL_HANDLE.targetRight,
  }
}
