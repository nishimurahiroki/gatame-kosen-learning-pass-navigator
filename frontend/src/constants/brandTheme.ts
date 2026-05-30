/**
 * ブランドの「濃紺＋ブラスゴールド」ゴーストCTA（細枠・透明地・大文字）。
 * Reference: unlock / membership 系 UI と同一トーン。
 */
export const ghostGoldCtaClass =
  'rounded-2xl border border-gatame-gold/65 bg-transparent px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.16em] text-gatame-gold shadow-none transition-[color,background-color,border-color,transform,box-shadow] hover:border-gatame-goldHi/90 hover:bg-gatame-gold/[0.07] hover:text-gatame-goldHi active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40'

/** セカンダリ（枠のみ弱め） */
export const ghostGoldCtaSubtleClass =
  'rounded-2xl border border-gatame-gold/45 bg-transparent px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.14em] text-gatame-gold/90 transition-[color,background-color,border-color] hover:border-gatame-gold/75 hover:bg-gatame-gold/[0.05] hover:text-gatame-goldHi'

/** SAVE PROGRESS（進捗保存）用のネオングリーン CTA。 */
export const saveProgressCtaClass =
  'inline-flex shrink-0 items-center justify-center rounded-2xl border border-emerald-300/80 bg-gradient-to-b from-emerald-300 via-emerald-400 to-emerald-500 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#02140b] shadow-[0_0_18px_rgba(16,185,129,0.55)] transition-[transform,box-shadow,filter] hover:shadow-[0_0_26px_rgba(16,185,129,0.75)] hover:brightness-[1.04] active:scale-[0.97] disabled:opacity-60 disabled:shadow-none'

/** Save progress モーダル内の Google 等・枠線トーンを Save progress ボタンに合わせる */
export const saveProgressAuthOutlineClass =
  'flex w-full items-center justify-center rounded-2xl border border-emerald-300/80 bg-transparent px-4 py-3 text-sm font-bold text-emerald-200 transition-[border-color,background-color,transform,box-shadow] hover:border-emerald-300 hover:bg-emerald-500/10 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60'

export const saveProgressAuthInputClass =
  'w-full rounded-xl border border-emerald-300/80 bg-black/40 px-4 py-3 text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/50 focus:border-emerald-300 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.35)]'

/** Today's focus ラベル（POP カード・ドロワー共通） */
export const todaysFocusBadgeClass =
  'block w-full rounded-xl border border-gatame-gold/70 bg-gradient-to-r from-gatame-gold/25 via-gatame-gold/12 to-transparent px-4 py-3 text-center text-base font-bold uppercase tracking-[0.12em] text-gatame-goldHi shadow-[0_0_24px_rgba(197,160,89,0.28)] sm:text-lg'

/** ドロワー内 CTA — ラベルを主役にした2行ボタン（Watch Video 等の主 CTA） */
export const todaysFocusDrawerButtonClass =
  'flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-gatame-gold/70 bg-gatame-gold/[0.14] px-4 py-3.5 text-center shadow-[0_0_28px_rgba(197,160,89,0.25)] transition-[background-color,box-shadow,transform,border-color] hover:border-gatame-goldHi/90 hover:bg-gatame-gold/22 hover:shadow-[0_0_36px_rgba(197,160,89,0.38)] active:scale-[0.99]'

/** ドロワー内セカンダリ — Today's Task（ゴールド枠・主 CTA より控えめ） */
export const todaysTaskDrawerButtonClass =
  'flex w-full cursor-pointer flex-col items-center gap-0.5 rounded-xl border border-gatame-gold/60 bg-gatame-gold/[0.06] px-3 py-2.5 text-center transition-[background-color,border-color,transform,box-shadow] hover:border-gatame-gold/85 hover:bg-gatame-gold/[0.14] hover:shadow-[0_0_14px_rgba(197,160,89,0.18)] active:scale-[0.98] active:bg-gatame-gold/20 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-gatame-gold/60 disabled:hover:bg-gatame-gold/[0.06] disabled:hover:shadow-none'
