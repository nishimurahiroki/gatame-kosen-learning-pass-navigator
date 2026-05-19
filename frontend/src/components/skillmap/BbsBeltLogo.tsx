import { BBS_BELT_LOGO_SRC } from '../../constants/bbsAssets'

type BbsBeltLogoProps = {
  size?: number
  className?: string
  alt?: string
}

export default function BbsBeltLogo({
  size = 32,
  className = '',
  alt = 'Black Belt System',
}: BbsBeltLogoProps) {
  return (
    <img
      src={BBS_BELT_LOGO_SRC}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain ${className}`.trim()}
      draggable={false}
    />
  )
}
