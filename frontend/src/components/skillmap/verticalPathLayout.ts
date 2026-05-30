/** コンテナ幅とブレークポイントに応じた学習パスレイアウト（React Flow の position は左上基準） */

export const PATH_BREAKPOINT_LG = 1024

export interface SerpentineLayoutResult {
  positions: { x: number; y: number }[]
  graphWidth: number
  graphHeight: number
  nodeBox: number
  rowStep: number
  outerWidth: number
}

/** PC すごろく: 1 行あたりのマス数（最大） */
const SUGOROKU_COLS_PC = 3

/** モバイル縦並び（PathStepNode の labelH / btnH と一致させる） */
export const MOBILE_PATH_LAYOUT = {
  nodeBox: 100,
  labelH: 56,
  btnH: 50,
  gap: 30,
  marginTop: 16,
  marginBottom: 56,
} as const

/**
 * モバイル: 縦一列（従来どおり）。
 * PC (lg+): すごろく状に折り返し（横に進み、行ごとに左右反転）— 縦スクロールを抑える。
 */
export function computePathLayout(
  count: number,
  containerWidth: number,
  isWide: boolean,
): SerpentineLayoutResult {
  if (!isWide) {
    return computeVerticalStackLayout(count, containerWidth)
  }
  return computeSugorokuLayout(count, containerWidth)
}

function computeVerticalStackLayout(
  count: number,
  containerWidth: number,
): SerpentineLayoutResult {
  const { nodeBox, labelH, btnH, gap, marginTop, marginBottom } = MOBILE_PATH_LAYOUT
  const labelBlock = labelH + btnH
  const rowStep = nodeBox + labelBlock + gap
  const outerWidth = 252

  const w = Math.max(containerWidth, 320)
  const cx = w / 2
  const amp = 32

  const positions: { x: number; y: number }[] = []
  for (let i = 0; i < count; i++) {
    const offset = (i % 2 === 0 ? -1 : 1) * Math.min(amp * 0.5, 26)
    const x = cx + offset - outerWidth / 2
    const y = marginTop + i * rowStep
    positions.push({ x, y })
  }

  const graphHeight =
    count === 0 ? 200 : marginTop + (count - 1) * rowStep + nodeBox + labelBlock + marginBottom
  const graphWidth = w

  return { positions, graphWidth, graphHeight, nodeBox, rowStep, outerWidth }
}

function computeSugorokuLayout(count: number, containerWidth: number): SerpentineLayoutResult {
  const nodeBox = 136
  const outerWidth = 300
  const horizontalGap = 88
  const colStep = outerWidth + horizontalGap
  const marginX = 40
  const marginTop = 48
  const marginBottom = 88

  const standardRowExtent = nodeBox + 76 + 52 + 64
  /** 末尾 BBS プレミアムカード（4+1 パス想定） */
  const premiumRowExtent = nodeBox + 168 + 36

  const w = Math.max(containerWidth, 720)
  const cols = Math.min(SUGOROKU_COLS_PC, Math.max(count, 1))
  const rows = Math.ceil(count / cols)

  const positions: { x: number; y: number }[] = Array.from({ length: count }, () => ({ x: 0, y: 0 }))
  let y = marginTop

  for (let row = 0; row < rows; row++) {
    const rowStart = row * cols
    const itemsInRow = Math.min(cols, count - rowStart)
    const reversed = row % 2 === 1
    const rowExtent = row === rows - 1 ? premiumRowExtent : standardRowExtent

    const rowWidth = (itemsInRow - 1) * colStep + outerWidth
    const startX = Math.max(marginX, (w - rowWidth) / 2)

    for (let j = 0; j < itemsInRow; j++) {
      const index = rowStart + j
      const col = reversed ? itemsInRow - 1 - j : j
      positions[index] = {
        x: startX + col * colStep,
        y,
      }
    }

    y += rowExtent
  }

  const graphHeight = count === 0 ? 240 : y + marginBottom
  const graphWidth = Math.max(w, (cols - 1) * colStep + outerWidth + marginX * 2)

  const rowStep = standardRowExtent

  return { positions, graphWidth, graphHeight, nodeBox, rowStep, outerWidth }
}
