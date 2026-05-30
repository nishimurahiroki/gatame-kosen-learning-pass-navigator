import { saveProgressCtaClass } from '../../constants/brandTheme'
import en from '../../locales/en.json'

type SaveProgressButtonProps = {
  onClick: () => void
  className?: string
}

export default function SaveProgressButton({ onClick, className = '' }: SaveProgressButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={en.top.syncBannerTitle}
      className={`${saveProgressCtaClass} shrink-0 ${className}`.trim()}
    >
      {en.top.syncBannerCta}
    </button>
  )
}
