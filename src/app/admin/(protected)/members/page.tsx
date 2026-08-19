// src/app/admin/(protected)/members/page.tsx
import { Users } from 'lucide-react'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { MemberList } from '@/components/admin/MemberList'
import { getMembers } from '@/lib/db/queries'

/**
 * Everyone registered on Plug.pk.
 *
 * The page reads the database; MemberList handles the filtering in the browser.
 */

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  const members = await getMembers()
  const withBusiness = members.filter((member) => member.businessCount > 0).length

  return (
    <>
      <AdminHeader
        title="Members"
        description={
          members.length === 0
            ? 'Nobody has registered yet.'
            : `${members.length} account${members.length === 1 ? '' : 's'}, ${withBusiness} with a business listing.`
        }
      />

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        {members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Users size={24} className="mx-auto mb-3 text-slate-400" aria-hidden="true" />
            <p className="text-ui font-semibold text-slate-900">No members yet</p>
            <p className="mt-1 text-ui-sm text-slate-500">
              Accounts created at /signup and through the business form appear here.
            </p>
          </div>
        ) : (
          <MemberList members={members} />
        )}
      </div>
    </>
  )
}
