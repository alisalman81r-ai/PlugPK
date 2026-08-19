// src/app/admin/(protected)/members/[id]/page.tsx
import { ArrowLeft, Bookmark, Building2, Car, Mail, MapPin, Star } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { MemberDeleteCard } from '@/components/admin/MemberDeleteCard'
import { getMemberById } from '@/lib/db/queries'
import { formatDate, formatRelativeTime } from '@/lib/utils'

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

const STATUS_TONE: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-800',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-slate-200 text-slate-700',
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Mail
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-ui-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-1 inline-flex items-center gap-1.5 text-ui-sm text-slate-700">
        <Icon size={13} className="shrink-0 text-slate-400" aria-hidden="true" />
        {children}
      </dd>
    </div>
  )
}

export default async function AdminMemberPage({ params }: PageProps) {
  const member = await getMemberById(params.id)
  if (!member) notFound()

  return (
    <>
      <AdminHeader title={member.name} description={member.email} />

      <div className="px-4 py-6 lg:px-8 lg:py-8">
        <Link
          href="/admin/members"
          className="mb-6 inline-flex items-center gap-1.5 text-ui-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          All members
        </Link>

        <div className="flex flex-col gap-6">
          {/* ── Who they are ─────────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 text-ui-lg font-bold text-slate-900">Account</h2>

            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Field icon={Mail} label="Email">
                {member.email}
              </Field>
              <Field icon={MapPin} label="City">
                {member.city ?? <span className="text-slate-400">Not set</span>}
              </Field>
              <Field icon={Car} label="Vehicle">
                {member.vehicle ?? <span className="text-slate-400">Not set</span>}
              </Field>
              <Field icon={Star} label="Joined">
                <span title={formatDate(member.joinedAt)}>
                  {formatRelativeTime(member.joinedAt)}
                </span>
              </Field>
            </dl>

            <p className="mt-5 border-t border-slate-100 pt-4 font-mono text-ui-xs text-slate-400">
              {member.id}
            </p>
          </section>

          {/* ── Their listings ───────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 text-ui-lg font-bold text-slate-900">
              <Building2 size={18} className="text-slate-400" aria-hidden="true" />
              Business listings ({member.businessCount})
            </h2>

            {member.businesses.length === 0 ? (
              <p className="text-ui-sm text-slate-500">None submitted from this account.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {member.businesses.map((business) => (
                  <li
                    key={business.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
                  >
                    <Link
                      href={`/admin/businesses/${business.id}`}
                      className="font-medium text-slate-900 hover:text-plug-blue-600 hover:underline"
                    >
                      {business.name}
                      <span className="ml-2 text-ui-sm font-normal text-slate-500">
                        {business.city}
                      </span>
                    </Link>
                    <span
                      className={`rounded-full px-2.5 py-1 text-ui-xs font-semibold ${
                        STATUS_TONE[business.status] ?? STATUS_TONE.pending
                      }`}
                    >
                      {business.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── What they wrote ──────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 text-ui-lg font-bold text-slate-900">
              <Star size={18} className="text-slate-400" aria-hidden="true" />
              Reviews ({member.reviewCount})
            </h2>

            {member.reviews.length === 0 ? (
              <p className="text-ui-sm text-slate-500">None written.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {member.reviews.map((review) => (
                  <li key={review.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{review.listingName}</p>
                      <span className="text-ui-xs text-slate-400">
                        {review.rating}/5 · {formatRelativeTime(review.date)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-3 text-ui-sm text-slate-600">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ── What they saved ──────────────────────────────── */}
          <section className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 text-ui-lg font-bold text-slate-900">
              <Bookmark size={18} className="text-slate-400" aria-hidden="true" />
              Saved listings ({member.savedCount})
            </h2>

            {member.saved.length === 0 ? (
              <p className="text-ui-sm text-slate-500">Nothing saved.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {member.saved.map((station) => (
                  <li
                    key={station.id}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-ui-sm text-slate-600"
                  >
                    {station.name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <MemberDeleteCard
            id={member.id}
            name={member.name}
            reviewCount={member.reviewCount}
            savedCount={member.savedCount}
            businessCount={member.businessCount}
          />
        </div>
      </div>
    </>
  )
}
