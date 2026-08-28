// src/app/admin/(protected)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/admin/AdminNav'
import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'
import { getAdminBadgeCounts } from '@/lib/db/admin-badges'

export const metadata = { title: { absolute: 'Plug.pk admin' } }

/**
 * Reads a cookie on every request, so it can never be statically rendered or
 * cached — an admin page served from cache is an admin page served to
 * whoever asks next.
 *
 * The (protected) route group exists so this guard does not wrap
 * /admin/login. A layout that redirects to a page inside itself would
 * redirect forever, and route groups do not affect the URL, so /admin still
 * resolves here.
 */
export const dynamic = 'force-dynamic'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect('/admin/login')
  }

  /*
   * Counted here rather than in each page, so every admin screen shows the same
   * figures and a page that has nothing to do with meetings still tells the
   * operator a meeting is waiting.
   *
   * Awaited after the session check, never before: an unauthenticated request
   * should be redirected without touching the database.
   *
   * This layout is already force-dynamic, so the counts are read per request
   * and go stale only for as long as a page is open — acting on an item and
   * landing back on a server-rendered page recounts them.
   */
  const badges = await getAdminBadgeCounts()

  return (
    /*
     * A row only from lg up, where the sidebar exists.
     *
     * This was `flex` at every width, and AdminNav renders two things: the
     * 248px column, hidden below lg, and the mobile top bar, hidden from lg up.
     * Below lg the column was gone but the bar was still a flex *item* in the
     * row, so it sat beside the content as a narrow left-hand column instead of
     * spanning the width above it. Measured on a 390px viewport, <main> was
     * 163px wide and every page overflowed its own screen.
     *
     * Stacking below lg puts the bar back on its own line at full width and
     * gives the content the whole viewport. Both of AdminNav's pieces already
     * carry the breakpoint that hides them, so neither participates in the
     * layout it does not belong to.
     */
    <div className="min-h-viewport bg-slate-50 lg:flex">
      <AdminNav badges={badges} />
      <main className="min-w-0 pb-16 lg:flex-1">{children}</main>
    </div>
  )
}
