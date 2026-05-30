import { memo, useCallback, type MouseEvent } from 'react'

import { type NodeProps } from 'reactflow'
import { PathTrailHandles } from './pathTrailHandles'

import type { BbsPromotionSlot } from '../../api/streetPathWithBbs'

import en from '../../locales/en.json'

import { getBbsLevelCardBackgroundSrc } from '../../constants/bbsAssets'
import BbsLevelCircleImage from './BbsLevelCircleImage'



export interface BbsPathStepNodeData {

  bbs: BbsPromotionSlot

  /** 互換用（常に false で渡す） */

  gateLocked: boolean

  nodeBox: number

  outerWidth: number

  isWide: boolean

  onOpen: (bbsId: string) => void

}



const BbsPathStepNode = memo(({ data, selected }: NodeProps<BbsPathStepNodeData>) => {

  const { bbs, gateLocked, nodeBox, outerWidth, isWide, onOpen } = data

  const isGate = bbs.isConversionGate

  const sizeScale = isWide ? 1.12 : 1

  const inner = Math.round(nodeBox * 0.82 * sizeScale)

  const mx = (outerWidth - nodeBox) / 2

  const cardWidth = Math.min(outerWidth, 300)
  const cardBackgroundSrc = getBbsLevelCardBackgroundSrc(bbs.urlLevel)
  const cardBackgroundStyle = cardBackgroundSrc
    ? {
        background: `linear-gradient(165deg, rgba(8, 14, 28, 0.38) 0%, rgba(5, 10, 20, 0.52) 100%), url(${cardBackgroundSrc}) center/cover no-repeat`,
      }
    : undefined



  const openDetail = useCallback(

    (e: MouseEvent) => {

      e.stopPropagation()

      if (gateLocked) return

      onOpen(bbs.id)

    },

    [bbs.id, gateLocked, onOpen],

  )



  const stop = (e: MouseEvent) => {

    e.stopPropagation()

  }



  if (!isGate) {

    return (

      <div

        className="relative flex flex-col items-center"

        style={{ width: outerWidth, minHeight: nodeBox + 200 }}

      >

        <div

          className="relative flex shrink-0 items-center justify-center"

          style={{ width: nodeBox, height: nodeBox, marginLeft: mx, marginRight: mx }}

        >

          <PathTrailHandles nodeBox={nodeBox} />

          <div

            role="button"

            tabIndex={gateLocked ? -1 : 0}

            onClick={openDetail}

            className="relative overflow-hidden rounded-full border-2 border-gatame-gold/50 bg-slate-900/92"

            style={{ width: inner, height: inner }}

          >

            <BbsLevelCircleImage level={bbs.urlLevel} fill size={Math.round(inner * 0.58)} alt="" />

          </div>

        </div>

        <p className="mt-2 text-center text-sm font-bold text-white">{bbs.titleEn}</p>

      </div>

    )

  }



  return (

    <div

      className="relative flex flex-col items-center"

      style={{ width: outerWidth, minHeight: nodeBox + 168 }}

    >

      <div

        className={[

          'bbs-path-premium-card relative z-[1] w-full',

          gateLocked ? 'bbs-path-premium-card--locked' : '',

        ].join(' ')}

        style={{ maxWidth: cardWidth, ...cardBackgroundStyle }}

      >

        <div

          className="relative mx-auto flex shrink-0 items-center justify-center"

          style={{ width: nodeBox, height: nodeBox }}

        >

          <PathTrailHandles nodeBox={nodeBox} />

          <div

            role="button"

            tabIndex={gateLocked ? -1 : 0}

            aria-disabled={gateLocked}

            onClick={openDetail}

            onKeyDown={(e) => {

              if (gateLocked) return

              if (e.key === 'Enter' || e.key === ' ') {

                e.preventDefault()

                onOpen(bbs.id)

              }

            }}

            className={[

              'bbs-path-premium-disc relative overflow-hidden flex items-center justify-center transition-transform',

              gateLocked ? 'bbs-path-premium-disc--locked cursor-not-allowed' : 'cursor-pointer hover:scale-[1.03] active:scale-[0.98]',

              selected && !gateLocked ? 'ring-2 ring-gatame-goldHi/50 ring-offset-2 ring-offset-[#0a0f1c]' : '',

            ].join(' ')}

            style={{ width: inner, height: inner }}

          >

            <BbsLevelCircleImage
              level={bbs.urlLevel}
              fill
              size={Math.round(inner * 0.58)}
              className={gateLocked ? 'opacity-45 grayscale' : 'opacity-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]'}
              alt=""
            />

          </div>

        </div>



        <div className="relative z-[1] mt-3 w-full px-0.5 text-center">

          <p

            className={[

              'line-clamp-2 font-bold leading-snug tracking-tight',

              gateLocked ? 'text-white/45' : 'bbs-path-premium-title',

              isWide ? 'text-[13px]' : 'text-[12px]',

            ].join(' ')}

          >

            {bbs.titleEn}

          </p>

          <p

            className={[

              'mt-1.5 line-clamp-2 text-[10px] leading-snug',

              gateLocked ? 'text-white/30' : 'text-gatame-gold/75',

            ].join(' ')}

          >

            {gateLocked ? en.bbsGate.lockedHint : bbs.subtextEn}

          </p>

        </div>



        <div className="nodrag nopan relative z-[1] mt-3 w-full px-0.5">

          <button

            type="button"

            disabled={gateLocked}

            onMouseDown={stop}

            onPointerDown={stop}

            onClick={openDetail}

            className="bbs-path-premium-cta relative w-full rounded-xl py-2.5 text-center text-xs font-bold tracking-wide disabled:cursor-not-allowed disabled:opacity-45"

          >

            <span className="relative z-[1]">{en.bbsGate.viewOffer}</span>

          </button>

        </div>

      </div>

    </div>

  )

})



BbsPathStepNode.displayName = 'BbsPathStepNode'



export default BbsPathStepNode


