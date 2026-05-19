import { memo, useCallback, type MouseEvent } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { BbsPromotionSlot } from '../../api/streetPathWithBbs'
import type { BbsLevelKey } from '../../constants/bbsOffers'
import BbsBeltLogo from './BbsBeltLogo'

export interface BbsPathStepNodeData {
  bbs: BbsPromotionSlot
  levelDeclaredMastered: boolean
  nodeBox: number
  outerWidth: number
  isWide: boolean
  onOpen: (bbsId: string) => void
  onDeclareMastered: (level: BbsLevelKey) => void
  onContinuePath: () => void
}

const BbsPathStepNode = memo(({ data, selected }: NodeProps<BbsPathStepNodeData>) => {
  const {
    bbs,
    levelDeclaredMastered,
    nodeBox,
    outerWidth,
    isWide,
    onOpen,
    onDeclareMastered,
    onContinuePath,
  } = data
  const mastered = levelDeclaredMastered
  const ringActive = !mastered ? 'path-node-active-ring' : ''
  const sizeScale = isWide ? 1.12 : 1
  const inner = Math.round(nodeBox * 0.82 * sizeScale)
  const mx = (outerWidth - nodeBox) / 2

  const openDetail = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      onOpen(bbs.id)
    },
    [bbs.id, onOpen],
  )

  const stop = (e: MouseEvent) => {
    e.stopPropagation()
  }

  const curriculum = bbs.curriculumAccessUrl

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: outerWidth, minHeight: nodeBox + 200 }}
    >
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: nodeBox, height: nodeBox, marginLeft: mx, marginRight: mx }}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={openDetail}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(bbs.id)
            }
          }}
          className={[
            'relative flex items-center justify-center rounded-full border-2 bg-slate-900/92 backdrop-blur-md transition-transform',
            ringActive,
            mastered
              ? 'border-emerald-500/85 shadow-[0_8px_28px_rgba(16,185,129,0.22),0_4px_12px_rgba(0,0,0,0.35)]'
              : 'border-gatame-gold shadow-[0_12px_40px_rgba(197,160,89,0.28),0_4px_16px_rgba(0,0,0,0.45)]',
            'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
            selected ? 'ring-2 ring-gatame-gold/40 ring-offset-2 ring-offset-slate-950' : '',
          ].join(' ')}
          style={{ width: inner, height: inner }}
        >
          <span className="flex flex-col items-center justify-center gap-0.5">
            <BbsBeltLogo size={Math.round(inner * 0.52)} className="opacity-95" alt="" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gatame-gold/90">BBS</span>
          </span>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="!h-2 !w-2 !border-0 !bg-transparent !opacity-0"
        />
      </div>

      <div className="mt-2 w-full max-w-[280px] px-1 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-gatame-gold/75">Black Belt System</p>
        <p
          className={`mt-1 line-clamp-2 font-bold leading-snug text-white ${
            isWide ? 'text-[14px]' : 'text-[12px]'
          }`}
        >
          {bbs.titleEn}
        </p>
        <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-white/60">{bbs.subtextEn}</p>
      </div>

      <div className="nodrag nopan mt-3 flex w-full max-w-[280px] flex-col gap-1.5 px-1">
        {curriculum ? (
          <a
            href={curriculum}
            target="_blank"
            rel="noreferrer"
            onMouseDown={stop}
            onPointerDown={stop}
            className="flex w-full items-center justify-center rounded-xl bg-gatame-gold py-2 text-center text-[11px] font-bold uppercase tracking-wide text-gatame-navy hover:brightness-110"
          >
            Access Curriculum
          </a>
        ) : null}
        <button
          type="button"
          disabled={mastered}
          onMouseDown={stop}
          onPointerDown={stop}
          onClick={(e) => {
            stop(e)
            if (!mastered) onDeclareMastered(bbs.sequenceLevel)
          }}
          className={`w-full rounded-xl border py-2 text-center text-[11px] font-bold uppercase tracking-wide transition-colors ${
            mastered
              ? 'cursor-default border-emerald-600/50 bg-emerald-950/40 text-emerald-300/80'
              : 'cursor-pointer border-emerald-500/50 bg-emerald-950/55 text-emerald-100 hover:bg-emerald-900/60'
          }`}
        >
          {mastered ? 'Level recorded' : "I've Mastered This Level"}
        </button>
        <button
          type="button"
          onMouseDown={stop}
          onPointerDown={stop}
          onClick={(e) => {
            stop(e)
            onContinuePath()
          }}
          className="w-full py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-white/45 underline-offset-2 hover:text-white/75"
        >
          Next technique — continue path
        </button>
      </div>
    </div>
  )
})

BbsPathStepNode.displayName = 'BbsPathStepNode'

export default BbsPathStepNode
