interface PathGenerationLoadingScreenProps {
  onCancel: () => void
  cancelLabel?: string
  title?: string
  subtitle?: string
}

/**
 * 学習パス生成中のフルスクリーンローディング。
 * 本番では最大 90 秒 × 最大 2 回の試行。ユーザーは「Cancel」で任意に中断できる。
 */
export default function PathGenerationLoadingScreen({
  onCancel,
  cancelLabel = 'Cancel',
  title = 'Building your learning path…',
  subtitle = 'This usually takes a few seconds.',
}: PathGenerationLoadingScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-gatame-gold border-t-transparent"
        role="status"
        aria-label="Loading"
      />
      <p className="mt-5 text-sm font-semibold text-white/80">{title}</p>
      <p className="mt-1 text-xs text-white/45">{subtitle}</p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-6 rounded-xl border border-white/20 px-5 py-2 text-xs font-bold uppercase tracking-wide text-white/80 transition-colors hover:border-gatame-gold/70 hover:bg-white/[0.04] hover:text-gatame-goldHi"
      >
        {cancelLabel}
      </button>
    </div>
  )
}
