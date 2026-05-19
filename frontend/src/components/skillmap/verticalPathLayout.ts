/** コンテナ幅とブレークポイントに応じた蛇行レイアウト（React Flow の position は左上基準） */

export const PATH_BREAKPOINT_LG = 1024

export interface SerpentineLayoutResult {
  positions: { x: number; y: number }[]
  graphWidth: number
  graphHeight: number
  nodeBox: number
  rowStep: number
  outerWidth: number
}

export function computeSerpentineLayout(
  count: number,
  containerWidth: number,
  isWide: boolean,
): SerpentineLayoutResult {
  const nodeBox = isWide ? 136 : 96
  /** ラベル行 + 完了ボタン行（BBS マイルストーンの複数 CTA 用に余白を確保） */
  const labelBlock = 76 + 52 + 80
  const gap = isWide ? 44 : 30
  const rowStep = nodeBox + labelBlock + gap
  const outerWidth = isWide ? 300 : 252
  const marginTop = 72
  const marginBottom = 140

  const w = Math.max(containerWidth, 320)
  const cx = w / 2
  const amp = isWide ? Math.min(220, w * 0.17) : 32

  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const t = i * 0.88
    const offset = isWide
      ? Math.sin(t) * amp + Math.sin(t * 0.42) * (amp * 0.38)
      : (i % 2 === 0 ? -1 : 1) * Math.min(amp * 0.5, 26)
    const x = cx + offset - outerWidth / 2
    const y = marginTop + i * rowStep
    positions.push({ x, y })
  }

  const graphHeight =
    count === 0 ? 200 : marginTop + (count - 1) * rowStep + nodeBox + labelBlock + marginBottom
  const graphWidth = w

  return { positions, graphWidth, graphHeight, nodeBox, rowStep, outerWidth }
}
