import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useId, useState } from 'react'
import { useMembershipAccess } from '../../context/MembershipAccessContext'
import type { AssessmentRequest } from '../../types'
import { GATAME_ANNUAL_JOIN_CHECKOUT_URL } from '../../constants/kajabiCheckout'
import {
  GATAME_OPEN_UNLOCK_MENU_EVENT,
  type OpenUnlockMenuEventDetail,
} from '../../utils/membershipUnlockMenuEvent'
import { KAJABI_MEMBER_LOGIN_URL } from '../../utils/membershipSelfDeclareStorage'
import ProfileScreen from '../profile/ProfileScreen'

const GOLD = '#D4AF37'
const BLACK = '#000000'

function UserGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function scrollToPathAnchor() {
  const path = document.getElementById('gatame-learning-path')
  const fallback = document.getElementById('gatame-app-main')
  ;(path ?? fallback)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export type AppBottomBarProps = {
  assessmentRequest: AssessmentRequest | null
  catalogModuleTotal: number
}

export default function AppBottomBar({ assessmentRequest, catalogModuleTotal }: AppBottomBarProps) {
  const menuId = useId()
  const { isMember, declareMember } = useMembershipAccess()
  const [unlockOpen, setUnlockOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  /** 完了モーダル等より前面に Unlock を重ねる（年間会員プロモからの起動用） */
  const [unlockElevated, setUnlockElevated] = useState(false)

  const closeProfile = useCallback(() => setProfileOpen(false), [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenUnlockMenuEventDetail>).detail
      setProfileOpen(false)
      setUnlockElevated(Boolean(d?.elevated))
      setUnlockOpen(true)
    }
    window.addEventListener(GATAME_OPEN_UNLOCK_MENU_EVENT, onOpen)
    return () => window.removeEventListener(GATAME_OPEN_UNLOCK_MENU_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!unlockOpen && !profileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUnlockOpen(false)
        setProfileOpen(false)
        setUnlockElevated(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [unlockOpen, profileOpen])

  const handleMember = useCallback(() => {
    declareMember()
    setUnlockOpen(false)
    setUnlockElevated(false)
  }, [declareMember])

  const handleJoin = useCallback(() => {
    window.open(GATAME_ANNUAL_JOIN_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
    setUnlockOpen(false)
    setUnlockElevated(false)
  }, [])

  const handleCenterClick = useCallback(() => {
    if (isMember) {
      window.location.assign(KAJABI_MEMBER_LOGIN_URL)
      return
    }
    setProfileOpen(false)
    setUnlockElevated(false)
    setUnlockOpen((v) => !v)
  }, [isMember])

  const centerLabel = isMember ? 'Login' : 'Unlock'
  const centerAria = isMember ? 'Open member login' : 'Open unlock options'

  const closeOverlays = () => {
    setUnlockOpen(false)
    setProfileOpen(false)
    setUnlockElevated(false)
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/35 font-sans md:inset-x-auto md:bottom-8 md:left-1/2 md:w-auto md:-translate-x-1/2 md:rounded-2xl md:border md:border-[#D4AF37]/35 md:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
        style={{
          backgroundColor: BLACK,
          color: GOLD,
          paddingBottom: 'max(10px, env(safe-area-inset-bottom, 0px))',
          fontFamily: 'Urbanist, system-ui, Segoe UI, sans-serif',
        }}
      >
        <nav
          className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-3 py-2.5 md:max-w-none md:gap-2 md:px-5 md:py-2"
          aria-label="Primary"
        >
          <button
            type="button"
            onClick={() => {
              closeOverlays()
              scrollToPathAnchor()
            }}
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-white/[0.06]"
            style={{ color: GOLD }}
          >
            Path
          </button>

          <div className="w-px shrink-0 self-stretch bg-[#D4AF37]/25 md:mx-1" aria-hidden />

          <button
            type="button"
            onClick={handleCenterClick}
            aria-label={centerAria}
            aria-expanded={!isMember ? unlockOpen : undefined}
            aria-haspopup={!isMember ? 'dialog' : undefined}
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-2 text-[13px] font-semibold uppercase tracking-[0.18em] transition-colors hover:bg-white/[0.06]"
            style={{ color: GOLD }}
          >
            {centerLabel}
          </button>

          <div className="w-px shrink-0 self-stretch bg-[#D4AF37]/25 md:mx-1" aria-hidden />

          <button
            type="button"
            onClick={() => {
              setUnlockOpen(false)
              setUnlockElevated(false)
              setProfileOpen((v) => !v)
            }}
            aria-expanded={profileOpen}
            aria-haspopup="dialog"
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-colors hover:bg-white/[0.06]"
            style={{ color: GOLD }}
          >
            <UserGlyph className="h-[15px] w-[15px] shrink-0 opacity-95" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Profile</span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {unlockOpen && (
          <motion.div
            className={`fixed inset-0 flex items-center justify-center bg-black/55 p-6 backdrop-blur-[2px] ${
              unlockElevated ? 'z-[170]' : 'z-[100]'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOverlays}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={menuId}
              className="w-full max-w-[320px]"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: 'spring', damping: 26, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-2xl border px-5 py-5 text-white shadow-[0_24px_64px_rgba(0,0,0,0.65)]"
                style={{
                  backgroundColor: BLACK,
                  borderColor: `${GOLD}55`,
                  fontFamily: 'Urbanist, system-ui, sans-serif',
                }}
              >
                <p
                  id={menuId}
                  className="text-center text-[11px] font-bold uppercase tracking-[0.28em]"
                  style={{ color: GOLD }}
                >
                  Unlock
                </p>
                <p className="mt-2 text-center text-xs leading-relaxed text-white/85">
                  Self-declare membership for a streamlined experience.
                </p>
                <div className="mt-5 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleMember}
                    className="rounded-xl border border-white/80 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition-[filter,transform] hover:bg-white/[0.08] active:scale-[0.99]"
                    style={{
                      backgroundColor: BLACK,
                    }}
                  >
                    Already a Member
                  </button>
                  <button
                    type="button"
                    onClick={handleJoin}
                    className="rounded-xl py-3 text-sm font-bold uppercase tracking-[0.12em] transition-[filter,transform] hover:brightness-110 active:scale-[0.99]"
                    style={{
                      backgroundColor: GOLD,
                      color: BLACK,
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ProfileScreen
        open={profileOpen && !unlockOpen}
        onClose={closeProfile}
        assessmentRequest={assessmentRequest}
        catalogModuleTotal={catalogModuleTotal}
      />
    </>
  )
}
