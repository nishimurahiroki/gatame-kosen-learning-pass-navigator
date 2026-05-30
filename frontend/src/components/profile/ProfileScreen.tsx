import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { ghostGoldCtaSubtleClass } from '../../constants/brandTheme'
import { GATAME_ANNUAL_JOIN_CHECKOUT_URL } from '../../constants/kajabiCheckout'
import { useMembershipAccess } from '../../context/MembershipAccessContext'
import en from '../../locales/en.json'
import { openMembershipOffer } from '../../utils/membershipOfferEvent'
import type { AssessmentRequest } from '../../types'
import {
  countCompletedTechniqueModules,
  GATAME_MODULE_PROGRESS_CHANGED_EVENT,
} from '../../utils/progressStorage'
import ProfileSyncStatus from './ProfileSyncStatus'

const underlineInput =
  'w-full border-0 border-b border-gatame-gold/30 bg-transparent py-2.5 text-[15px] text-white placeholder:text-white/35 outline-none transition-colors focus:border-gatame-goldHi focus:ring-0'

function resolveDisplayName(user: User): string {
  const meta = user.user_metadata as Record<string, unknown> | undefined
  const fromMeta =
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (typeof meta?.name === 'string' && meta.name.trim()) ||
    ''
  if (fromMeta) return fromMeta
  const email = user.email ?? ''
  const local = email.split('@')[0] ?? ''
  return local || 'Member'
}

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return '—'
  try {
    return new Date(createdAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

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

export interface ProfileScreenProps {
  open: boolean
  onClose: () => void
  assessmentRequest: AssessmentRequest | null
  catalogModuleTotal: number
}

export default function ProfileScreen({
  open,
  onClose,
  assessmentRequest,
  catalogModuleTotal,
}: ProfileScreenProps) {
  const { session, signOut } = useAuth()
  const user = session?.user

  const catalogTotalSafe = Math.max(1, catalogModuleTotal)

  const [modulesCompleted, setModulesCompleted] = useState(0)

  const { hasAnnualMembership, markAnnualPurchased } = useMembershipAccess()
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [emailExpanded, setEmailExpanded] = useState(false)
  const [emailDraft, setEmailDraft] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  const [signingOut, setSigningOut] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const syncModuleProgress = useCallback(() => {
    setModulesCompleted(countCompletedTechniqueModules(assessmentRequest))
  }, [assessmentRequest])

  useEffect(() => {
    syncModuleProgress()
  }, [syncModuleProgress])

  useEffect(() => {
    if (!open) return
    syncModuleProgress()
    const onChanged = () => syncModuleProgress()
    window.addEventListener(GATAME_MODULE_PROGRESS_CHANGED_EVENT, onChanged)
    window.addEventListener('storage', onChanged)
    return () => {
      window.removeEventListener(GATAME_MODULE_PROGRESS_CHANGED_EVENT, onChanged)
      window.removeEventListener('storage', onChanged)
    }
  }, [open, syncModuleProgress])

  useEffect(() => {
    if (!open || !user) return
    setDisplayName(resolveDisplayName(user))
    setEmailDraft(user.email ?? '')
    setNotice(null)
    setFormError(null)
    setEmailExpanded(false)
  }, [open, user?.id, user?.email, user?.user_metadata])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const clearFeedback = useCallback(() => {
    setNotice(null)
    setFormError(null)
  }, [])

  const handleSaveDisplayName = async () => {
    if (!user || !supabase) return
    const next = displayName.trim()
    if (!next) {
      setFormError('Display name cannot be empty.')
      return
    }
    clearFeedback()
    setSavingName(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { display_name: next },
      })
      if (error) setFormError(error.message)
      else setNotice('Display name saved.')
    } finally {
      setSavingName(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!user || !supabase) return
    const next = emailDraft.trim()
    if (!next || next === user.email) {
      setFormError('Enter a new email address.')
      return
    }
    clearFeedback()
    setSavingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: next })
      if (error) setFormError(error.message)
      else {
        setNotice('Confirmation sent to your new email. Check both inboxes.')
        setEmailExpanded(false)
      }
    } finally {
      setSavingEmail(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      onClose()
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const handleUpgrade = () => {
    window.open(GATAME_ANNUAL_JOIN_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
  }

  const handleOpenOffer = () => {
    onClose()
    openMembershipOffer()
  }

  const progressPercent = Math.min(
    100,
    Math.round((modulesCompleted / catalogTotalSafe) * 100),
  )

  if (!user) return null

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[115] flex justify-center overflow-y-auto bg-black/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-screen-title"
            className="relative z-10 my-auto flex max-h-[min(92vh,820px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gatame-gold/40 bg-gatame-midnight shadow-[0_32px_100px_rgba(0,0,0,0.75)]"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gatame-gold/20 px-6 py-4">
              <p
                id="profile-screen-title"
                className="text-[10px] font-semibold uppercase tracking-[0.32em] text-gatame-goldHi/88"
              >
                Account
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-gatame-goldHi"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8 pt-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gatame-gold/35 text-gatame-goldHi/90">
                  <UserGlyph className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                    {displayName.trim() || resolveDisplayName(user)}
                  </h2>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/42">
                    Member since{' '}
                    <span className="text-gatame-goldHi/80">{formatMemberSince(user.created_at)}</span>
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-gatame-gold/22 bg-[#060b14] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_-16px_rgba(0,0,0,0.55)]">
                <div className="flex items-start justify-between gap-3">
                  <p className="pt-1 text-[9px] font-semibold uppercase tracking-[0.34em] text-gatame-goldHi/70">
                    Progress
                  </p>
                  <p
                    className="shrink-0 bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-600 bg-clip-text text-2xl font-black tabular-nums tracking-tight text-transparent sm:text-[1.75rem]"
                    aria-label={`${progressPercent} percent complete`}
                  >
                    {progressPercent}%
                  </p>
                </div>
                <div className="relative mt-4">
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/[0.06]"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-700 via-yellow-500 to-amber-400 shadow-[0_0_22px_rgba(251,191,36,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]"
                      initial={false}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-[11px] font-medium tabular-nums tracking-wide text-white/42">
                  {modulesCompleted} / {catalogTotalSafe} Modules Completed
                </p>
                {!hasAnnualMembership ? (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    className="mt-4 w-full text-left text-[11px] font-medium leading-relaxed text-gatame-gold/88 underline decoration-gatame-gold/35 underline-offset-[5px] transition-colors hover:text-gatame-goldHi hover:decoration-gatame-goldHi/55"
                  >
                    Upgrade to Annual to unlock all {catalogTotalSafe} modules.
                  </button>
                ) : null}
              </div>

              <section className="mt-6 rounded-2xl border border-white/[0.08] bg-[#060b14]/80 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/38">
                  {en.membership.profile.heading}
                </p>
                <p className="mt-2 text-sm text-white/85">
                  {hasAnnualMembership ? en.membership.profile.active : en.membership.profile.inactive}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {!hasAnnualMembership ? (
                    <button
                      type="button"
                      onClick={handleOpenOffer}
                      className={`${ghostGoldCtaSubtleClass} px-5 py-2.5 text-[10px]`}
                    >
                      {en.membership.profile.viewPlans}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={markAnnualPurchased}
                    className="rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white/70"
                  >
                    {en.membership.profile.markPurchased}
                  </button>
                </div>
              </section>

              <ProfileSyncStatus />

              {formError ? (
                <p className="mt-6 rounded-lg border border-red-500/25 bg-red-950/25 px-3 py-2 text-sm text-red-200/95">
                  {formError}
                </p>
              ) : null}
              {notice ? (
                <p className="mt-6 rounded-lg border border-gatame-goldHi/40 bg-gatame-gold/[0.07] px-3 py-2 text-sm text-gatame-goldHi">
                  {notice}
                </p>
              ) : null}

              <section className="mt-10 space-y-4 border-t border-white/[0.06] pt-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/38">Display name</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value)
                      clearFeedback()
                    }}
                    className={`${underlineInput} flex-1`}
                    autoComplete="name"
                    placeholder="Your name"
                  />
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={() => void handleSaveDisplayName()}
                    className={`${ghostGoldCtaSubtleClass} shrink-0 px-6 py-2.5 text-[10px]`}
                  >
                    Save
                  </button>
                </div>
              </section>

              <section className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setEmailExpanded((v) => !v)
                    clearFeedback()
                  }}
                  className="flex w-full items-center justify-between border-b border-transparent py-2 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-gatame-gold/85 transition-colors hover:text-gatame-goldHi"
                >
                  <span>Email address</span>
                  <span className="text-white/35">{emailExpanded ? '−' : '+'}</span>
                </button>
                <AnimatePresence initial={false}>
                  {emailExpanded ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 pb-2 pt-3">
                        <input
                          type="email"
                          value={emailDraft}
                          onChange={(e) => {
                            setEmailDraft(e.target.value)
                            clearFeedback()
                          }}
                          className={underlineInput}
                          autoComplete="email"
                        />
                        <button
                          type="button"
                          disabled={savingEmail}
                          onClick={() => void handleSaveEmail()}
                          className={`${ghostGoldCtaSubtleClass} w-full py-2.5 text-[10px] sm:w-auto`}
                        >
                          Update email
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </section>

              <div className="mt-14 border-t border-white/[0.06] pt-8">
                <button
                  type="button"
                  disabled={signingOut}
                  onClick={() => void handleSignOut()}
                  className="w-full py-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/38 transition-colors hover:text-gatame-goldHi"
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
