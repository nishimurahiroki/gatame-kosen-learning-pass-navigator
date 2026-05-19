interface EnvErrorScreenProps {
  missingKeys: string[]
}

/**
 * 環境変数（Supabase）未設定時に表示する代替画面。
 * 真っ白なホワイトアウトの代わりに、開発者・ユーザーの双方に
 * 「何が足りないか」「どう直すか」を提示する。
 */
export default function EnvErrorScreen({ missingKeys }: EnvErrorScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gatame-midnight px-6 py-12 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-red-500/40 bg-slate-950/80 p-7 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-red-300/90">
          Configuration error
        </p>
        <h1 className="mt-2 text-xl font-bold leading-snug text-white sm:text-2xl">
          The app can&apos;t start because required environment variables are missing.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/75">
          Create a <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[12px]">frontend/.env</code>
          {' '}file and define the keys below, then restart the dev server.
        </p>

        <ul className="mt-4 space-y-1.5 rounded-xl border border-white/10 bg-black/40 p-4">
          {missingKeys.map((key) => (
            <li key={key} className="font-mono text-[13px] text-amber-200">
              {key}=<span className="text-white/45">…</span>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs leading-relaxed text-white/55">
          These keys point the frontend at your Supabase project for authentication.
          Without them no user can sign in or sign up. After fixing, reload the page.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 w-full rounded-xl border border-gatame-gold/55 bg-gatame-gold/10 px-4 py-2.5 text-sm font-bold text-gatame-goldHi transition-colors hover:bg-gatame-gold/20"
        >
          Reload after fixing
        </button>
      </div>
    </div>
  )
}
