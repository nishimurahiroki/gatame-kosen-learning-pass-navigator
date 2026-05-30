import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import topPageBgSrc from '@image/TopPage-image.webp'
import { GATAME_LOGO_SRC } from '../constants/brandAssets'
import { useAuth } from '../context/AuthContext'
import { loadRemoteLearningPath } from '../api/supabaseProgressApi'
import en from '../locales/en.json'
import { DIAGNOSTIC_PATH, redirectToAccess, redirectToDiagnostic } from '../utils/authRoutes'
import { getGuestStorageId } from '../utils/guestDevice'
import { isLocalPathReady } from '../utils/learningPathPersistence'
import { setResumeLocalIntent } from '../utils/resumeIntent'

type PrimaryCta = 'start' | 'resumeLocal' | 'resumeMember'

/** 背景画像の上でも読めるよう TopPage 専用のコントラスト */
const topPageBgOverlayClass =
  'pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050a14]/88 via-[#0a1128]/82 to-[#050a14]/92'

const topPageContentPanelClass =
  'rounded-3xl border border-white/15 bg-[#0a1128]/88 px-6 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.65)] backdrop-blur-md sm:px-8'

const topPagePrimaryCtaClass =
  'rounded-2xl border-2 border-gatame-gold bg-gatame-gold/20 px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-gatame-goldHi shadow-[0_0_24px_rgba(197,160,89,0.32)] transition-[color,background-color,border-color,transform,box-shadow] hover:border-gatame-goldHi hover:bg-gatame-gold/30 hover:shadow-[0_0_32px_rgba(197,160,89,0.42)] active:scale-[0.99]'

const topPageSecondaryCtaClass =
  'rounded-2xl border border-gatame-gold/80 bg-black/45 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gatame-gold transition-[color,background-color,border-color,box-shadow] hover:border-gatame-goldHi hover:bg-black/55 hover:text-gatame-goldHi hover:shadow-[0_0_16px_rgba(197,160,89,0.22)]'

export default function TopPage() {
  const { session, loading: authLoading } = useAuth()
  const guestStorageId = useMemo(() => getGuestStorageId(), [])
  const [remoteReady, setRemoteReady] = useState(false)
  const [checkingRemote, setCheckingRemote] = useState(false)

  const localReady = isLocalPathReady(guestStorageId)
  const memberUserId = session?.user?.id
  const memberLocalReady = memberUserId ? isLocalPathReady(memberUserId) : false

  useEffect(() => {
    if (!memberUserId) {
      setRemoteReady(false)
      setCheckingRemote(false)
      return
    }
    let cancelled = false
    setCheckingRemote(true)
    void (async () => {
      const remote = await loadRemoteLearningPath(memberUserId)
      if (!cancelled) {
        setRemoteReady(remote != null)
        setCheckingRemote(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [memberUserId])

  const primaryCta: PrimaryCta = useMemo(() => {
    if (memberUserId && (remoteReady || memberLocalReady)) return 'resumeMember'
    if (localReady) return 'resumeLocal'
    return 'start'
  }, [memberUserId, remoteReady, memberLocalReady, localReady])

  const primaryLabel =
    primaryCta === 'resumeMember'
      ? en.top.ctaResumeMember
      : primaryCta === 'resumeLocal'
        ? en.top.ctaResumeLocal
        : en.top.ctaStartAssessment

  const handlePrimary = () => {
    if (primaryCta === 'start') {
      window.location.href = DIAGNOSTIC_PATH
      return
    }
    if (primaryCta === 'resumeLocal') {
      setResumeLocalIntent()
    }
    redirectToDiagnostic()
  }

  const handleSignInToContinue = () => {
    redirectToAccess(false)
  }

  /** ローカルに再開データがなく未ログイン — 新規診断とログイン復元の両方を明示 */
  const showDualEntry = primaryCta === 'start' && !memberUserId

  if (authLoading || (memberUserId && checkingRemote)) {
    return (
      <div
        className="relative flex min-h-screen items-center justify-center bg-gatame-navy bg-cover bg-center"
        style={{ backgroundImage: `url(${topPageBgSrc})` }}
      >
        <div className={topPageBgOverlayClass} aria-hidden />
        <div
          className="relative z-10 h-12 w-12 animate-spin rounded-full border-2 border-gatame-gold border-t-transparent"
          role="status"
          aria-label="Loading"
        />
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-gatame-midnight bg-cover bg-center px-4 py-12"
      style={{ backgroundImage: `url(${topPageBgSrc})` }}
    >
      <div className={topPageBgOverlayClass} aria-hidden />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`relative z-10 w-full max-w-lg text-center ${topPageContentPanelClass}`}
      >
        <img
          src={GATAME_LOGO_SRC}
          alt="Gatame"
          className="mx-auto mb-6 h-12 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] sm:h-14"
          draggable={false}
        />
        <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)] sm:text-3xl">
          <span className="text-gatame-goldHi">GATAME</span> {en.app.title}
        </h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-white/88">{en.top.subtitle}</p>

        {showDualEntry ? (
          <div className="mt-10 space-y-3">
            <button type="button" onClick={handlePrimary} className={`${topPagePrimaryCtaClass} w-full`}>
              {en.top.ctaStartAssessment}
            </button>
            <button
              type="button"
              onClick={handleSignInToContinue}
              className={`${topPageSecondaryCtaClass} w-full`}
            >
              {en.top.ctaSignInToContinue}
            </button>
            <p className="pt-2 text-xs leading-relaxed text-white/82">{en.top.returningUserHint}</p>
          </div>
        ) : (
          <div className="mt-10 space-y-4">
            <button type="button" onClick={handlePrimary} className={`${topPagePrimaryCtaClass} w-full`}>
              {primaryLabel}
            </button>
          </div>
        )}

        {!showDualEntry && !memberUserId ? (
          <div className="mt-6 rounded-2xl border border-gatame-gold/35 bg-black/40 px-4 py-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
            <p className="text-sm font-bold text-white">{en.top.crossDeviceHeading}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/82">{en.top.crossDeviceBody}</p>
            <button
              type="button"
              onClick={handleSignInToContinue}
              className={`${topPageSecondaryCtaClass} mt-4 w-full`}
            >
              {en.top.crossDeviceCta}
            </button>
          </div>
        ) : null}

        {memberUserId ? (
          <p className="mt-4 text-[11px] text-white/65">{en.top.signedInHint}</p>
        ) : null}
      </motion.div>
    </div>
  )
}
