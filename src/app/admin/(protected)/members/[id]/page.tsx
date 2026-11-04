// src/app/admin/(protected)/members/[id]/page.tsx
import { notFound } from 'next/navigation'

import { ActivityPanel } from '@/components/admin/ActivityPanel'
import { getAdminActor } from '@/lib/db/admin-access'
import { getMemberAdminFacts } from '@/lib/db/admin-queries'
import { getMemberActivity } from '@/lib/db/member-activity-queries'
import { getMemberById } from '@/lib/db/queries'

import { MemberView } from './member-view'

/**
 * One member, and everything held against their account.
 *
 * The point of the detail view is that deleting somebody is a decision made
 * with the consequences visible — which listings become ownerless, which
 * reviews disappear — rather than from a row in a list.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string }
}

export default async function AdminMemberPage({ params }: PageProps) {
  const [member, facts, actor, activity] = await Promise.all([
    getMemberById(params.id),
    getMemberAdminFacts(params.id),
    getAdminActor(),
    getMemberActivity(params.id),
  ])
  if (!member || !facts) notFound()

  return (
    <MemberView
      member={member}
      facts={facts}
      isSelf={actor?.id === member.id}
      activity={activity}
      auditPanel={<ActivityPanel targetType="member" targetId={member.id} />}
    />
  )
}
