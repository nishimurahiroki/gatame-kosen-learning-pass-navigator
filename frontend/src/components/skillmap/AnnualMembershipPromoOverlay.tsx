import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { GATAME_ANNUAL_JOIN_CHECKOUT_URL } from '../../constants/kajabiCheckout'
import { ghostGoldCtaClass, ghostGoldCtaSubtleClass } from '../../constants/brandTheme'
import ConfirmDialog from '../common/ConfirmDialog'
import en from '../../locales/en.json'

const BRASS = '#c5a059'

export interface AnnualMembershipPromoOverlayProps {
  open: boolean
  /** 閉じるのみ（永続ブロックしない） */
  onClose: () => void
  /** Annual を購入済みとして記録し、以後プロモを出さない */
  onMarkAnnualPurchased: () => void
}

export default function AnnualMembershipPromoOverlay({
  open,
  onClose,
  onMarkAnnualPurchased,
}: AnnualMembershipPromoOverlayProps) {
  const handlePrimary = () => {
    window.open(GATAME_ANNUAL_JOIN_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleDismiss = () => {
    onClose()
  }

  const [confirmPurchasedOpen, setConfirmPurchasedOpen] = useState(false)

  const handleMarkPurchased = () => {
    setConfirmPurchasedOpen(true)
  }

  const handleConfirmPurchased = () => {
    setConfirmPurchasedOpen(false)
    onMarkAnnualPurchased()
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[160] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="annual-membership-title"
        >
          <motion.div
            className="relative mx-auto max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-gatame-gold/45 bg-gatame-midnight px-6 py-7 text-white shadow-[0_28px_96px_rgba(0,0,0,0.72)] sm:px-8 sm:py-9"
            style={{
              fontFamily: 'Urbanist, system-ui, Segoe UI, sans-serif',
            }}
            initial={{ scale: 0.94, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
          >
            <div
              className="mb-3 inline-flex rounded-full border border-gatame-gold/60 px-3 py-1 text-[13px] font-bold uppercase tracking-[0.22em] text-gatame-gold"
            >
              Annual Membership
            </div>
            <h2
              id="annual-membership-title"
              className="text-xl font-black leading-tight tracking-tight text-gatame-gold sm:text-2xl"
            >
              Complete Your Path with Video Guidance
            </h2>

            <ul className="mt-6 space-y-4 text-left text-sm leading-relaxed text-white sm:text-[15px]">
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: BRASS }} />
                <span>
                  <span className="font-bold text-white">Watch 150+ Technical Videos</span>
                  <span className="mt-1 block text-[13px] font-normal text-white/85">
                    Step-by-step high-legibility guidance.
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: BRASS }} />
                <span>
                  <span className="font-bold text-white">$900 or $800 Member Savings</span>
                  <span className="mt-1 block text-[13px] font-normal text-white/85">
                    Kyukyu $100 / Sankyu $200 (Standard: $1,000)
                  </span>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: BRASS }} />
                <span>
                  <span className="font-bold text-white">Full Technique Mastery</span>
                  <span className="mt-1 block text-[13px] font-normal text-white/85">
                    Comprehensive coverage of every drill.
                  </span>
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handlePrimary}
                className={`${ghostGoldCtaClass} w-full py-4 text-sm`}
              >
                {en.membership.offer.viewPlansCta}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-2xl border border-white/25 bg-transparent px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.16em] text-white/85 transition-colors hover:border-white/45 hover:bg-white/[0.04] sm:shrink-0"
              >
                Not now
              </button>
            </div>
            <button
              type="button"
              onClick={handleMarkPurchased}
              className={`${ghostGoldCtaSubtleClass} mt-5 w-full border-gatame-gold/40 py-3 text-[11px]`}
            >
              I have Annual Membership
            </button>
          </motion.div>
          <ConfirmDialog
            open={confirmPurchasedOpen}
            title={en.confirm.annualMembership.title}
            description={en.confirm.annualMembership.description}
            confirmLabel={en.confirm.annualMembership.confirm}
            cancelLabel={en.common.cancel}
            tone="default"
            onConfirm={handleConfirmPurchased}
            onCancel={() => setConfirmPurchasedOpen(false)}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
