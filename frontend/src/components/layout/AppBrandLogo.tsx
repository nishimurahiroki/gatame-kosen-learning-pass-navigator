import { GATAME_LOGO_SRC } from '../../constants/brandAssets'

interface AppBrandLogoProps {
  /**
   * `fixed` (default): 左上に絶対配置。診断画面など Pass UI と重ならない画面用。
   * `inline`: 親レイアウト内のフロー要素として描画。Pass UI のヘッダー左に並べる用途。
   */
  variant?: 'fixed' | 'inline'
  /** true のときロゴタップで tapHref へ遷移 */
  tappableToHome?: boolean
  /** tappableToHome 時の遷移先（省略時はアプリトップ `/`） */
  tapHref?: string
}

const logoImgClassInline = 'h-7 w-auto object-contain object-left sm:h-9'
const logoImgClassFixed = 'h-8 w-auto max-w-[min(36vw,140px)] object-contain object-left sm:h-12 md:h-14'

function logoLinkProps(href: string) {
  const external = href.startsWith('http')
  return {
    href,
    ...(external
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {}),
    'aria-label': external ? 'Visit Gatame Kosen Online (opens in new tab)' : 'Go to top page',
  }
}

export default function AppBrandLogo({
  variant = 'fixed',
  tappableToHome = false,
  tapHref = '/',
}: AppBrandLogoProps) {
  const linkClass =
    variant === 'inline'
      ? 'shrink-0 rounded-md p-0.5 transition-opacity hover:opacity-85 active:opacity-75'
      : 'rounded-md p-0.5 transition-opacity hover:opacity-85 active:opacity-75'

  if (variant === 'inline') {
    if (tappableToHome) {
      return (
        <a {...logoLinkProps(tapHref)} className={linkClass}>
          <img
            src={GATAME_LOGO_SRC}
            alt=""
            aria-hidden
            className={logoImgClassInline}
            draggable={false}
          />
        </a>
      )
    }
    return (
      <img
        src={GATAME_LOGO_SRC}
        alt=""
        aria-hidden
        className={`${logoImgClassInline} shrink-0`}
        draggable={false}
      />
    )
  }

  if (tappableToHome) {
    return (
      <div className="fixed left-0 top-0 z-[25] p-1 sm:p-3">
        <a {...logoLinkProps(tapHref)} className={linkClass}>
          <img
            src={GATAME_LOGO_SRC}
            alt=""
            className={logoImgClassFixed}
            draggable={false}
          />
        </a>
      </div>
    )
  }

  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[25] p-1 sm:p-3" aria-hidden>
      <img
        src={GATAME_LOGO_SRC}
        alt=""
        className={logoImgClassFixed}
        draggable={false}
      />
    </div>
  )
}
