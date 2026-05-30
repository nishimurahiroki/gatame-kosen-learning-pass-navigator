import { useMembershipAccess } from '../../context/MembershipAccessContext'
import { todaysFocusDrawerButtonClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'
import { openMembershipOffer } from '../../utils/membershipOfferEvent'
import { KAJABI_MEMBER_LOGIN_URL } from '../../utils/membershipSelfDeclareStorage'

export type ReferenceVideoAccessPromoProps = {
  videoUrl: string
}

const footerBtnClass = `${todaysFocusDrawerButtonClass} w-full`

export default function ReferenceVideoAccessPromo({ videoUrl: _videoUrl }: ReferenceVideoAccessPromoProps) {
  const { hasAnnualMembership } = useMembershipAccess()

  if (hasAnnualMembership) {
    return (
      <button
        type="button"
        onClick={() => window.open(KAJABI_MEMBER_LOGIN_URL, '_blank', 'noopener,noreferrer')}
        className={footerBtnClass}
        aria-label={`${en.pathDrawer.watchVideoCta} — ${en.pathDrawer.watchVideoSubcopy}`}
      >
        <span className="text-base font-bold uppercase tracking-[0.1em] text-gatame-goldHi sm:text-lg">
          {en.pathDrawer.watchVideoCta}
        </span>
        <span className="text-xs font-semibold text-white/75">{en.pathDrawer.watchVideoSubcopy}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => openMembershipOffer()}
      className={footerBtnClass}
      aria-label={`${en.pathDrawer.getMembershipCta} — ${en.pathDrawer.getMembershipSubcopy}`}
    >
      <span className="text-base font-bold uppercase tracking-[0.1em] text-gatame-goldHi sm:text-lg">
        {en.pathDrawer.getMembershipCta}
      </span>
      <span className="text-xs font-semibold text-white/75">{en.pathDrawer.getMembershipSubcopy}</span>
    </button>
  )
}
