// src/app/admin/(protected)/settings/page.tsx
import { redirect } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { AccountSettings } from '@/components/dashboard/AccountSettings'
import { getCurrentProfile } from '@/lib/db/session-actions'

/**
 * The signed-in operator's own account, inside the admin portal: name, photo,
 * city, password and signed-in devices. The same form and the same actions as
 * the member dashboard's settings page — an operator is an account like any
 * other — without the driver's garage row, which has no place here.
 *
 * The (protected) layout has already checked this is an operator; this page
 * only reads whose account it is.
 */

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Account settings' }

export default async function AdminSettingsPage({ searchParams }: { searchParams: { changePassword?: string } }) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login?redirect=/admin/settings')

  return (
    <>
      <AdminHeader title="Account settings" description="Your profile, password and signed-in devices." />
      <div className="max-w-3xl" data-in>
        <AccountSettings
          user={{
            name: profile.name,
            email: profile.email,
            city: profile.city,
            vehicle: profile.vehicle,
            avatar: profile.avatar,
          }}
          mustChangePassword={profile.mustChangePassword || searchParams.changePassword === '1'}
          showVehicle={false}
        />
      </div>
    </>
  )
}
