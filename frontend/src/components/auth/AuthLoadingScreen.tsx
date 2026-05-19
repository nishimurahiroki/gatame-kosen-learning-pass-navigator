export default function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-gatame-gold border-t-transparent"
        role="status"
        aria-label="Loading"
      />
      <p className="mt-4 text-sm text-white/45">Loading…</p>
    </div>
  )
}
