/**
 * Shown while any admin screen's data is loading.
 *
 * Without a `loading.tsx`, Next keeps the PREVIOUS page on screen, frozen,
 * until the next one's server data resolves. Navigation therefore looked like
 * nothing had happened — reported as "in admin page UI is not interacting like
 * in loading animation". This is the missing feedback, and because it is a
 * route-level Suspense boundary it appears the instant a link is clicked.
 *
 * Deliberately shaped like the screens it stands in for — a title, a couple of
 * cards, a list — so the layout does not jump when the real content lands.
 */
export default function Loading() {
  return (
    <div className="max-w-4xl space-y-8 animate-none" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      <div className="space-y-2.5">
        <div className="sk h-7 w-52" />
        <div className="sk h-4 w-72" />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="a-card rounded-2xl p-5 space-y-3">
            <div className="sk h-3.5 w-20" />
            <div className="sk h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="a-card rounded-2xl p-5 space-y-4">
        <div className="sk h-5 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="sk h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="sk h-3.5" style={{ width: `${70 - i * 9}%` }} />
              <div className="sk h-3" style={{ width: `${45 - i * 6}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
