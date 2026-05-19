import { GATAME_LOGO_SRC } from '../../constants/brandAssets'

interface AppBrandLogoProps {
  /**
   * `fixed` (default): 左上に絶対配置。診断画面など Pass UI と重ならない画面用。
   * `inline`: 親レイアウト内のフロー要素として描画。Pass UI のヘッダー左に並べる用途。
   */
  variant?: 'fixed' | 'inline'
}

export default function AppBrandLogo({ variant = 'fixed' }: AppBrandLogoProps) {
  if (variant === 'inline') {
    return (
      <img
        src={GATAME_LOGO_SRC}
        alt=""
        aria-hidden
        className="h-7 w-auto shrink-0 object-contain object-left sm:h-9"
        draggable={false}
      />
    )
  }
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-[25] p-1 sm:p-3" aria-hidden>
      <img
        src={GATAME_LOGO_SRC}
        alt=""
        className="h-8 w-auto max-w-[min(36vw,140px)] object-contain object-left sm:h-12 md:h-14"
        draggable={false}
      />
    </div>
  )
}
