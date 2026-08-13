// src/app/admin/(protected)/layout.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AdminNav } from '@/components/admin/AdminNav'
import { ADMIN_COOKIE_NAME, verifySessionValue } from '@/lib/admin-auth'

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

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!verifySessionValue(cookies().get(ADMIN_COOKIE_NAME)?.value)) {
    redirect('/admin/login')
  }

  return (
    <div className="flex min-h-viewport bg-slate-50">
      <AdminNav />
      <main className="min-w-0 flex-1 pb-16">{children}</main>
    </div>
  )
}
