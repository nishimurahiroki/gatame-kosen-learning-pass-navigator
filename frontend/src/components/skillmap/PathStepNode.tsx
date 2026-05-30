import { memo, useCallback, useState, type MouseEvent } from 'react'
import { type NodeProps } from 'reactflow'
import { getModuleCircleImageSrc, getModuleCircleContentAnchor } from '../../constants/moduleCircleImages'
import type { ScoredModule } from '../../types'
import CircleCoverImage from './CircleCoverImage'
import { PathTrailHandles } from './pathTrailHandles'

export type PathStepVisualState = 'completed' | 'active' | 'locked' | 'waiting'

export interface PathStepNodeData {
  module: ScoredModule
  categoryLabel: string
  visualState: PathStepVisualState
  prerequisitesMet: boolean
  /** 詳細パネルの練習 TODO がすべて完了しているか（完了済みノードでは未使用） */
  todosComplete: boolean
  nodeBox: number
  outerWidth: number
  isWide: boolean
  onOpen: (moduleId: string) => void
  onToggleComplete: (moduleId: string) => void
  /** TODO 完了後にフィードバックへ進む（完了済みの解除は onToggleComplete） */
  onRequestCompleteFeedback: (moduleId: string) => void
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 11V8a5 5 0 0110 0v3M6 11h12v10H6V11z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ModuleThumbCircle({ module }: { module: ScoredModule }) {
  const [broken, setBroken] = useState(false)
  const src = getModuleCircleImageSrc(module.id) ?? module.thumbnailUrl
  if (!src || broken) {
    return (
      <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-800 font-black text-gatame-gold/90 text-[clamp(1rem,28%,2rem)]">
        {module.name.slice(0, 1)}
      </span>
    )
  }
  return (
    <CircleCoverImage
      src={src}
      contentAnchor={getModuleCircleContentAnchor(module.id)}
      onError={() => setBroken(true)}
    />
  )
}

const PathStepNode = memo(({ data, selected }: NodeProps<PathStepNodeData>) => {
  const {
    module,
    categoryLabel,
    visualState,
    prerequisitesMet,
    todosComplete,
    nodeBox,
    outerWidth,
    isWide,
    onOpen,
    onToggleComplete,
    onRequestCompleteFeedback,
  } = data

  const completed = visualState === 'completed'
  const clickable = completed || visualState === 'active'

  const ringActive = visualState === 'active' ? 'path-node-active-ring' : ''
  const sizeScale = isWide ? 1.12 : 1
  const inner = Math.round(nodeBox * 0.82 * sizeScale)

  const openDetail = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      if (clickable) onOpen(module.id)
    },
    [clickable, module.id, onOpen],
  )

  const completeDisabled =
    !completed &&
    (!prerequisitesMet || module.locked || visualState !== 'active' || !todosComplete)

  const completeLabel = 'Completed'

  const labelH = isWide ? 76 : 56
  const btnH = isWide ? 52 : 44
  const mx = (outerWidth - nodeBox) / 2

  const handleCompleteClick = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      if (completed) {
        onToggleComplete(module.id)
        return
      }
      if (completeDisabled) return
      onRequestCompleteFeedback(module.id)
    },
    [completed, completeDisabled, module.id, onRequestCompleteFeedback, onToggleComplete],
  )

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: outerWidth, height: nodeBox + labelH + btnH }}
    >
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: nodeBox, height: nodeBox, marginLeft: mx, marginRight: mx }}
      >
        <PathTrailHandles nodeBox={nodeBox} />

        <div
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={openDetail}
          onKeyDown={(e) => {
            if (!clickable) return
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(module.id)
            }
          }}
          className={[
            'relative overflow-hidden rounded-full border-2 bg-slate-900/92 backdrop-blur-md transition-transform',
            ringActive,
            visualState === 'active'
              ? 'border-gatame-gold shadow-[0_12px_40px_rgba(197,160,89,0.35),0_4px_16px_rgba(0,0,0,0.45)]'
              : visualState === 'completed'
                ? 'border-emerald-500/85 shadow-[0_8px_28px_rgba(16,185,129,0.22),0_4px_12px_rgba(0,0,0,0.35)]'
                : visualState === 'waiting'
                  ? 'border-slate-500/45 opacity-[0.55] shadow-[0_4px_14px_rgba(0,0,0,0.25)]'
                  : 'border-slate-600/75 saturate-[0.6] shadow-[0_4px_14px_rgba(0,0,0,0.35)]',
            clickable ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : 'cursor-default',
            selected ? 'ring-2 ring-gatame-gold/40 ring-offset-2 ring-offset-slate-950' : '',
          ].join(' ')}
          style={{ width: inner, height: inner }}
        >
          <ModuleThumbCircle module={module} />

          {visualState === 'completed' ? (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 shadow-lg ring-2 ring-slate-950">
              <CheckIcon className="h-6 w-6 text-emerald-100" />
            </span>
          ) : null}

          {visualState === 'locked' ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/82">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/75 ring-2 ring-gatame-gold/70 shadow-[0_0_18px_rgba(212,175,55,0.45)]">
                <LockIcon className="h-6 w-6 text-gatame-goldHi" />
              </span>
            </span>
          ) : null}
        </div>

      </div>

      <div className="mt-1 w-full px-1 text-center" style={{ minHeight: labelH - 8 }}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gatame-gold/75">
          {categoryLabel}
        </p>
        <p
          className={`mt-0.5 line-clamp-2 font-bold leading-snug text-white ${
            isWide ? 'text-[15px]' : 'text-[13px]'
          }`}
        >
          {module.name}
        </p>
      </div>

      <div className="nodrag nopan mt-0.5 w-full max-w-[260px] px-1">
        <button
          type="button"
          disabled={!completed && completeDisabled}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={handleCompleteClick}
          className={`w-full rounded-xl text-xs font-bold transition-colors active:scale-[0.99] ${
            isWide ? 'py-2.5' : 'py-2'
          } ${
            completed
              ? 'border border-emerald-500/50 bg-emerald-600/20 text-emerald-200 hover:bg-emerald-600/30'
              : completeDisabled
                ? 'cursor-not-allowed bg-slate-800 text-slate-500'
                : 'cursor-pointer bg-gatame-gold text-gatame-navy hover:brightness-110'
          }`}
        >
          {completeLabel}
        </button>
      </div>
    </div>
  )
})

PathStepNode.displayName = 'PathStepNode'

export default PathStepNode
