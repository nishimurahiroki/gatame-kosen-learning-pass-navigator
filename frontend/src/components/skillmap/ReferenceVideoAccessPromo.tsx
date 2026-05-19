import { useMembershipAccess } from '../../context/MembershipAccessContext'
import { ghostGoldCtaClass, ghostGoldCtaSubtleClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'
import { openMembershipUnlockMenu } from '../../utils/membershipUnlockMenuEvent'
import { KAJABI_MEMBER_LOGIN_URL } from '../../utils/membershipSelfDeclareStorage'

export type ReferenceVideoAccessPromoProps = {
  videoUrl: string
}

const labelMuted = 'text-xs font-semibold uppercase tracking-wide text-slate-500'

const unlockBtnClass = `${ghostGoldCtaClass} mt-2 w-full text-sm tracking-[0.12em]`

const loginBtnClass = `${ghostGoldCtaSubtleClass} mt-2 w-full text-sm tracking-[0.12em]`

export default function ReferenceVideoAccessPromo({ videoUrl }: ReferenceVideoAccessPromoProps) {
  const { isMember } = useMembershipAccess()

  return (
    <div>
      <p className={labelMuted}>{en.pathDrawer.referenceVideo}</p>
      {isMember ? (
        <button
          type="button"
          onClick={() => window.open(KAJABI_MEMBER_LOGIN_URL, '_blank', 'noopener,noreferrer')}
          className={loginBtnClass}
        >
          {en.pathDrawer.watchVideoLoginCta}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openMembershipUnlockMenu()}
          className={unlockBtnClass}
        >
          {en.pathDrawer.unlockFullAccessCta}
        </button>
      )}
      {videoUrl.trim().length > 0 ? (
        <p className="mt-2 truncate text-xs text-slate-500" title={videoUrl}>
          {videoUrl}
        </p>
      ) : null}
    </div>
  )
}
