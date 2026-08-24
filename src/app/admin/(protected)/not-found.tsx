// src/app/admin/(protected)/not-found.tsx
import { FileQuestion } from 'lucide-react'
import Link from 'next/link'

/**
 * The portal's own not-found page.
 *
 * There was no not-found boundary anywhere in the application, so every
 * `notFound()` inside /admin fell through to the public site's 404 — which meant
 * a mistyped station id rendered marketing chrome inside the admin shell, with
 * a "back to the map" invitation an operator has no use for.
 *
 * It also cost the status code. With no boundary in the segment, Next served the
 * fallback page with a 200 on every admin dynamic route — /admin/stations/nope,
 * /admin/services/nope and the rest all returned "not found" content under a
 * success status. Anything reading the status rather than the body — a crawler,
 * an uptime check, a fetch in a script — was told the record existed.
 *
 * Placed on the (protected) group so it inherits the auth layout: a 404 inside
 * the portal must not be a way to see the portal's shell without a session.
 */
export default function AdminNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-8 py-16">
      <div className="max-w-md text-center">
        <span
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400"
        >
          <FileQuestion size={24} />
        </span>

        <h1 className="mt-5 text-xl font-bold text-slate-900">Nothing at this address</h1>
        <p className="mt-2 text-ui-sm leading-relaxed text-slate-500">
          The record was not found, or the URL does not match a section of the portal. If you
          followed a link from a list, the record may have been deleted since the page loaded.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/admin"
            className="inline-flex h-10 items-center rounded-lg bg-plug-blue-600 px-4 text-ui font-semibold text-white transition-colors hover:bg-plug-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            Back to overview
          </Link>
          <Link
            href="/admin/cars"
            className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-ui font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-plug-blue-500 focus-visible:ring-offset-2"
          >
            Cars
          </Link>
        </div>
      </div>
    </div>
  )
}
