// src/app/(main)/for-businesses/page.tsx
import { permanentRedirect } from 'next/navigation'

/**
 * Retired: Partner Up is the one business page.
 *
 * This was a second landing page for the same offer, in an older style, and
 * the two disagreed — this one said "Live in 24 hours" and "Join hundreds of
 * businesses already reaching EV owners" while /partners showed an empty
 * directory and a meeting form promising a reply in two working days. The
 * meeting request it hosted now sits on /partners under the same #meeting
 * anchor.
 *
 * A permanent (308) redirect so search engines move the URL's standing across.
 * The fragment is never sent to the server, and browsers carry it over a
 * redirect, so /for-businesses#meeting lands on /partners#meeting.
 */
export default function ForBusinessesPage(): never {
  permanentRedirect('/partners')
}
