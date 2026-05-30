import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { GATAME_ANNUAL_JOIN_CHECKOUT_URL } from '../../constants/kajabiCheckout'
import { ghostGoldCtaClass, ghostGoldCtaSubtleClass } from '../../constants/brandTheme'
import { useMembershipAccess } from '../../context/MembershipAccessContext'
import { KAJABI_MEMBER_LOGIN_URL } from '../../utils/membershipSelfDeclareStorage'
import ConfirmDialog from '../common/ConfirmDialog'
import en from '../../locales/en.json'

const BRASS = '#c5a059'

export type MembershipOfferSheetProps = {
  open: boolean
  elevated?: boolean
  onClose: () => void
}

export default function MembershipOfferSheet({ open, elevated = false, onClose }: MembershipOfferSheetProps) {
  const { markAnnualPurchased } = useMembershipAccess()
  const [confirmPurchasedOpen, setConfirmPurchasedOpen] = useState(false)

  const handleViewPlans = () => {
    window.open(GATAME_ANNUAL_JOIN_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    onClose()
  }

  const handleConfirmPurchased = () => {
    setConfirmPurchasedOpen(false)
    markAnnualPurchased()
    onClose()
    window.open(KAJABI_MEMBER_LOGIN_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <AnimatePresence>
        {open ? (
          <motion.div
            className={`fixed inset-0 flex items-center justify-center bg-black/55 p-6 backdrop-blur-[2px] ${
              elevated ? 'z-[170]' : 'z-[100]'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="membership-offer-title"
              className="relative mx-auto max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-gatame-gold/45 bg-gatame-midnight px-6 py-7 text-white shadow-[0_28px_96px_rgba(0,0,0,0.72)] sm:px-8 sm:py-9"
              style={{ fontFamily: 'Urbanist, system-ui, Segoe UI, sans-serif' }}
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 inline-flex rounded-full border border-gatame-gold/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-gatame-gold">
                {en.membership.offer.badge}
              </p>
              <h2 id="membership-offer-title" className="text-xl font-black leading-tight tracking-tight text-gatame-gold sm:text-2xl">
                {en.membership.offer.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{en.membership.offer.subcopy}</p>

              <ul className="mt-6 space-y-4 text-left text-sm leading-relaxed text-white sm:text-[15px]">
                {en.membership.offer.benefits.map((benefit) => (
                  <li key={benefit.title} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: BRASS }} />
                    <span>
                      <span className="font-bold text-white">{benefit.title}</span>
                      <span className="mt-1 block text-[13px] font-normal text-white/85">{benefit.body}</span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                <button type="button" onClick={handleViewPlans} className={`${ghostGoldCtaClass} w-full py-4 text-sm`}>
                  {en.membership.offer.viewPlansCta}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmPurchasedOpen(true)}
                  className={`${ghostGoldCtaSubtleClass} w-full border-gatame-gold/40 py-3 text-[11px]`}
                >
                  {en.membership.offer.alreadyPurchasedCta}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50 transition-colors hover:text-white/75"
                >
                  {en.common.close}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
    </>
  )
}
