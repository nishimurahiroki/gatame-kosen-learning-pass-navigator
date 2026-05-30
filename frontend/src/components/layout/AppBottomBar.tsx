import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useMembershipAccess } from '../../context/MembershipAccessContext'
import type { AssessmentRequest } from '../../types'
import {
  GATAME_OPEN_MEMBERSHIP_OFFER_EVENT,
  type OpenMembershipOfferEventDetail,
} from '../../utils/membershipOfferEvent'
import { KAJABI_MEMBER_LOGIN_URL } from '../../utils/membershipSelfDeclareStorage'
import MembershipOfferSheet from '../membership/MembershipOfferSheet'
import SyncSaveModal from '../auth/SyncSaveModal'
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

function VideoGlyph({ className }: { className?: string }) {
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
      <polygon points="5 3 19 12 5 21 5 3" />
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
  const { session } = useAuth()
  const isAppLoggedIn = Boolean(session?.user)
  const { hasAnnualMembership } = useMembershipAccess()
  const [offerOpen, setOfferOpen] = useState(false)
  const [offerElevated, setOfferElevated] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [syncSaveOpen, setSyncSaveOpen] = useState(false)

  const closeProfile = useCallback(() => setProfileOpen(false), [])

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenMembershipOfferEventDetail>).detail
      setProfileOpen(false)
      setOfferElevated(Boolean(d?.elevated))
      setOfferOpen(true)
    }
    window.addEventListener(GATAME_OPEN_MEMBERSHIP_OFFER_EVENT, onOpen)
    return () => window.removeEventListener(GATAME_OPEN_MEMBERSHIP_OFFER_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!offerOpen && !profileOpen && !syncSaveOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOfferOpen(false)
        setProfileOpen(false)
        setSyncSaveOpen(false)
        setOfferElevated(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [offerOpen, profileOpen, syncSaveOpen])

  const handleCenterClick = useCallback(() => {
    if (hasAnnualMembership) {
      window.open(KAJABI_MEMBER_LOGIN_URL, '_blank', 'noopener,noreferrer')
      return
    }
    setProfileOpen(false)
    setSyncSaveOpen(false)
    setOfferElevated(false)
    setOfferOpen(true)
  }, [hasAnnualMembership])

  const centerLabel = hasAnnualMembership ? 'Videos' : 'Membership'
  const centerAria = hasAnnualMembership
    ? 'Open Gatame Kosen Online video login'
    : 'View Annual Membership offer'

  const closeOverlays = () => {
    setOfferOpen(false)
    setProfileOpen(false)
    setSyncSaveOpen(false)
    setOfferElevated(false)
  }

  return (
    <>
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D4AF37]/35 font-sans md:inset-x-auto md:bottom-8 md:right-14 md:w-auto md:rounded-2xl md:border md:border-[#D4AF37]/35 md:shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
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
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-colors hover:bg-white/[0.06]"
            style={{ color: GOLD }}
          >
            {hasAnnualMembership ? (
              <VideoGlyph className="h-[15px] w-[15px] shrink-0 opacity-95" />
            ) : null}
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">{centerLabel}</span>
          </button>

          <div className="w-px shrink-0 self-stretch bg-[#D4AF37]/25 md:mx-1" aria-hidden />

          <button
            type="button"
            onClick={() => {
              if (!isAppLoggedIn) {
                setOfferOpen(false)
                setOfferElevated(false)
                setProfileOpen(false)
                setSyncSaveOpen(true)
                return
              }
              setOfferOpen(false)
              setOfferElevated(false)
              setSyncSaveOpen(false)
              setProfileOpen((v) => !v)
            }}
            aria-expanded={isAppLoggedIn ? profileOpen : syncSaveOpen}
            aria-haspopup="dialog"
            className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-2 transition-colors hover:bg-white/[0.06]"
            style={{ color: GOLD }}
          >
            <UserGlyph className="h-[15px] w-[15px] shrink-0 opacity-95" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Profile</span>
          </button>
        </nav>
      </div>

      <MembershipOfferSheet
        open={offerOpen && !profileOpen}
        elevated={offerElevated}
        onClose={() => {
          setOfferOpen(false)
          setOfferElevated(false)
        }}
      />

      <ProfileScreen
        open={profileOpen && !offerOpen}
        onClose={closeProfile}
        assessmentRequest={assessmentRequest}
        catalogModuleTotal={catalogModuleTotal}
      />
      <SyncSaveModal open={syncSaveOpen} onClose={() => setSyncSaveOpen(false)} />
    </>
  )
}
