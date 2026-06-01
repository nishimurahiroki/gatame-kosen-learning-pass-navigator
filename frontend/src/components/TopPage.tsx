import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import topPageBgSrc from '@image/TopPage-image.webp'
import { GATAME_LOGO_SRC } from '../constants/brandAssets'
import {
  TOP_PAGE_LP_FEATURE_IMAGES,
  TOP_PAGE_LP_MEMBERSHIP_IMAGE,
} from '../constants/topPageLpImages'
import { GATAME_ANNUAL_JOIN_CHECKOUT_URL } from '../constants/kajabiCheckout'
import { useAuth } from '../context/AuthContext'
import { loadRemoteLearningPath } from '../api/supabaseProgressApi'
import en from '../locales/en.json'
import { DIAGNOSTIC_PATH, redirectToAccess, redirectToDiagnostic } from '../utils/authRoutes'
import { getGuestStorageId } from '../utils/guestDevice'
import { isLocalPathReady } from '../utils/learningPathPersistence'
import { setResumeLocalIntent } from '../utils/resumeIntent'

type PrimaryCta = 'start' | 'resumeLocal' | 'resumeMember'

/** ヒーロー（1画面分）のみに適用。ページ全体に bg-cover すると LP 分の高さまで拡大され画像が判別不能になる */
const topPageHeroBgClass = 'bg-gatame-midnight bg-cover bg-center bg-no-repeat'

/** 背景写真の上にだけかかる暗幕。薄くする場合はここだけ編集（/0〜100。下げるほど写真が見える） */
const topPageBgOverlayClass =
  'pointer-events-none absolute inset-0 bg-gradient-to-b from-[#050a14]/5 via-[#0a1128]/5 to-[#050a14]/15'

/** 中央カードの見た目（背景オーバーレイとは別） */
const topPageContentPanelClass =
  'rounded-3xl border border-white/15 bg-[#050a14]/94 px-6 py-8 shadow-[0_24px_64px_rgba(0,0,0,0.72)] backdrop-blur-md sm:px-8'

const topPagePrimaryCtaClass =
  'rounded-2xl border-2 border-gatame-gold bg-gatame-gold/20 px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-gatame-goldHi shadow-[0_0_24px_rgba(197,160,89,0.32)] transition-[color,background-color,border-color,transform,box-shadow] hover:border-gatame-goldHi hover:bg-gatame-gold/30 hover:shadow-[0_0_32px_rgba(197,160,89,0.42)] active:scale-[0.99]'

const topPageSecondaryCtaClass =
  'rounded-2xl border border-gatame-gold/80 bg-black/45 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gatame-gold transition-[color,background-color,border-color,box-shadow] hover:border-gatame-goldHi hover:bg-black/55 hover:text-gatame-goldHi hover:shadow-[0_0_16px_rgba(197,160,89,0.22)]'

/** LP 機能行: 行幅を抑えた均等2列（1fr+固定px だと PC でテキストと画像が離れすぎる） */
const topPageLpFeatureRowClass =
  'mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-9 border-b border-white/10 py-10 last:border-b-0 md:grid-cols-2 md:gap-x-5 md:py-12 lg:max-w-6xl lg:gap-x-6'

function LpBulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-white/80">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-0.5 shrink-0 text-gatame-gold" aria-hidden>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function LpSectionPhoneImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex justify-center px-1 sm:px-2">
      <img
        src={src}
        alt={alt}
        className="h-auto w-full max-h-[min(720px,74vh)] max-w-[min(100%,380px)] object-contain object-center sm:max-w-[420px] md:max-w-[460px] lg:max-w-[520px]"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  )
}

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

  const handleStartAssessment = () => {
    window.location.href = DIAGNOSTIC_PATH
  }

  const handleMembershipOptions = () => {
    window.open(GATAME_ANNUAL_JOIN_CHECKOUT_URL, '_blank', 'noopener,noreferrer')
  }

  /** ローカルに再開データがなく未ログイン — 新規診断とログイン復元の両方を明示 */
  const showDualEntry = primaryCta === 'start' && !memberUserId

  if (authLoading || (memberUserId && checkingRemote)) {
    return (
      <div
        className={`relative flex min-h-screen items-center justify-center ${topPageHeroBgClass}`}
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
    <div className="bg-gatame-midnight">
      <section
        className={`relative isolate flex min-h-[100svh] items-center justify-center px-4 py-12 ${topPageHeroBgClass}`}
        style={{ backgroundImage: `url(${topPageBgSrc})` }}
      >
        <div className={topPageBgOverlayClass} aria-hidden />
        <div className="relative z-10 flex w-full items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`w-full max-w-lg text-center ${topPageContentPanelClass}`}
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
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6 text-center md:mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gatame-gold">{en.top.lpBadge}</p>
          <h2 className="mt-2 text-xl font-black tracking-tight text-white sm:text-3xl">
            {en.top.lpHeading}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/75">
            {en.top.lpSubheading}
          </p>
        </div>

        <div>
          {en.top.lpFeatures.map((feature, idx) => (
            <article
              key={feature.title}
              className={`${topPageLpFeatureRowClass} ${
                idx % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
              }`}
            >
              <div className="md:px-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gatame-gold/85">
                  {feature.kicker}
                </p>
                <h3 className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75 md:max-w-none">
                  {feature.body}
                </p>
                <LpBulletList items={feature.bullets} />
              </div>
              <LpSectionPhoneImage
                src={TOP_PAGE_LP_FEATURE_IMAGES[idx] ?? TOP_PAGE_LP_FEATURE_IMAGES[0]}
                alt={feature.title}
              />
            </article>
          ))}
        </div>

        <article className={`${topPageLpFeatureRowClass} border-b-0 pt-4`}>
          <div className="md:px-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gatame-gold/85">
              {en.top.lpMembershipKicker}
            </p>
            <h3 className="mt-1.5 text-lg font-bold tracking-tight text-white sm:text-xl">
              {en.top.lpMembershipHeading}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{en.top.lpMembershipBody}</p>
            <LpBulletList items={en.top.lpMembershipBullets} />
            <button
              type="button"
              onClick={handleMembershipOptions}
              className={`${topPageSecondaryCtaClass} mt-4 w-full sm:w-auto`}
            >
              {en.top.lpMembershipCta}
            </button>
          </div>
          <LpSectionPhoneImage src={TOP_PAGE_LP_MEMBERSHIP_IMAGE} alt={en.top.lpMembershipHeading} />
        </article>

        <div className="mt-6 text-center">
          <button type="button" onClick={handleStartAssessment} className={`${topPagePrimaryCtaClass} w-full max-w-md`}>
            {en.top.ctaStartAssessmentNow}
          </button>
        </div>
      </section>
    </div>
  )
}
