export type AssessmentStatementItem = {
  id: string
  title: string
  description: string
}

type AssessmentStatementListProps = {
  items: AssessmentStatementItem[]
  /** 単一選択 */
  selectedId?: string | null
  /** 複数選択 */
  selectedIds?: string[]
  onSelect: (id: string) => void
  'aria-labelledby'?: string
}

function isSelected(
  id: string,
  selectedId: string | null | undefined,
  selectedIds: string[] | undefined,
): boolean {
  if (selectedIds !== undefined) return selectedIds.includes(id)
  return selectedId === id
}

function SelectionIndicator({
  mode,
  selected,
}: {
  mode: 'radio' | 'checkbox'
  selected: boolean
}) {
  if (mode === 'radio') {
    return (
      <span
        aria-hidden
        className={[
          'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-[#D4AF37]' : 'border-white/40',
        ].join(' ')}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />}
      </span>
    )
  }

  return (
    <span
      aria-hidden
      className={[
        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
        selected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/40 bg-transparent',
      ].join(' ')}
    >
      {selected && (
        <svg viewBox="0 0 12 12" className="h-3 w-3 text-black" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  )
}

export default function AssessmentStatementList({
  items,
  selectedId,
  selectedIds,
  onSelect,
  'aria-labelledby': ariaLabelledby,
}: AssessmentStatementListProps) {
  const multi = selectedIds !== undefined
  const indicatorMode = multi ? 'checkbox' : 'radio'

  return (
    <ul
      role={multi ? 'group' : 'radiogroup'}
      aria-labelledby={ariaLabelledby}
      className="flex flex-col gap-2.5 font-sans sm:gap-3"
    >
      {items.map((item) => {
        const selected = isSelected(item.id, selectedId, selectedIds)
        return (
          <li key={item.id}>
            <button
              type="button"
              role={multi ? 'checkbox' : 'radio'}
              onClick={() => onSelect(item.id)}
              aria-checked={selected}
              className={[
                'flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left text-sm leading-snug',
                'transition-all duration-200 active:scale-[0.99] sm:py-4 sm:text-[15px]',
                selected
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/30'
                  : 'border-[#D4AF37]/25 bg-black hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/[0.05]',
              ].join(' ')}
            >
              <SelectionIndicator mode={indicatorMode} selected={selected} />
              <span className="flex min-w-0 flex-1 flex-col gap-1 text-left">
                <span className="font-bold leading-snug text-white">{item.title}</span>
                <span className="text-[13px] leading-relaxed text-white/85 sm:text-[14px]">
                  {item.description}
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
