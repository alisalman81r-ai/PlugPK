// src/app/admin/(protected)/cars/review/page.tsx
import { AlertTriangle, CheckCircle2, GitCompare, ShieldAlert, type LucideIcon } from 'lucide-react'

import { AdminHeader } from '@/components/admin/AdminHeader'
import { ReviewQueue, type ProposalRow } from '@/components/admin/ReviewQueue'
import { listProposals, proposalCounts } from '@/lib/db/car-review-queries'
import { listSources } from '@/lib/db/car-source-queries'
import { cn } from '@/lib/utils'

/**
 * The review queue: proposed changes to the catalogue, awaiting a decision.
 *
 * This is the gate the whole crawler exists to feed. Nothing a source publishes
 * reaches a public page without passing through here, and there is deliberately
 * no action on this screen that applies an unread queue.
 */

export const metadata = { title: { absolute: 'Review · Plug.pk admin' } }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: {
    risk?: string
    type?: string
    source?: string
    car?: string
    minConfidence?: string
  }
}

/** Only the values the store accepts, so a hand-typed URL cannot widen a query. */
const RISKS = new Set(['safe', 'review', 'high-risk'])
const TYPES = new Set([
  'new',
  'changed',
  'conflicting',
  'source-disagreement',
  'suspicious',
  'unit-mismatch',
  'missing',
])

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export default async function AdminCarReviewPage({ searchParams }: PageProps) {
  const risk = searchParams.risk && RISKS.has(searchParams.risk) ? searchParams.risk : undefined
  const type = searchParams.type && TYPES.has(searchParams.type) ? searchParams.type : undefined
  const minConfidence = Number(searchParams.minConfidence)

  const [proposals, counts, sources] = await Promise.all([
    listProposals({
      status: 'pending',
      ...(risk ? { riskLevel: risk as 'safe' | 'review' | 'high-risk' } : {}),
      ...(type ? { changeType: type } : {}),
      ...(searchParams.source ? { sourceId: searchParams.source } : {}),
      ...(Number.isFinite(minConfidence) ? { minConfidence } : {}),
      limit: 200,
    }),
    proposalCounts(),
    listSources(),
  ])

  const rows: ProposalRow[] = proposals
    .filter((proposal) => !searchParams.car || proposal.car.slug === searchParams.car)
    .map((proposal) => ({
      id: proposal.id,
      carSlug: proposal.car.slug,
      carName: proposal.car.fullName,
      field: proposal.field,
      currentValue: proposal.currentValue,
      proposedValue: proposal.proposedValue,
      rawValue: proposal.rawValue,
      unit: proposal.unit,
      changeType: proposal.changeType,
      riskLevel: proposal.riskLevel,
      confidence: proposal.confidence,
      confidenceReasons: proposal.confidenceReasons,
      sourceId: proposal.sourceId,
      sourceUrl: proposal.sourceUrl,
      fetchedAt: proposal.fetchedAt.toISOString(),
      opinions: parseJson(proposal.opinions, [] as ProposalRow['opinions']),
      validationFlags: parseJson(proposal.validationFlags, [] as ProposalRow['validationFlags']),
    }))

  return (
    <>
      <AdminHeader
        title="Review"
        description={`${counts.pending} proposed change${counts.pending === 1 ? '' : 's'} waiting on a decision.`}
      />

      <div className="px-8 py-8">
        {/*
          Said once, at the top. An operator arriving here should know before
          clicking anything that these rows are proposals and that the public
          site is unaffected until they act.
        */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-4 sm:flex-row sm:items-start">
          <GitCompare size={18} className="mt-0.5 shrink-0 text-plug-blue-600" aria-hidden="true" />
          <div className="min-w-0 text-ui-sm">
            <p className="font-semibold text-slate-900">
              Nothing here has changed the public site.
            </p>
            <p className="mt-1 leading-relaxed text-slate-600">
              Each row is one field, from one source, compared against what the catalogue holds
              now. Approving writes that single field and records who did it and why; rejecting
              keeps the source record but changes nothing. A newer value never wins on its own —
              that is what this screen is for.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Tile icon={GitCompare} value={counts.pending} label="Pending" detail="Awaiting a decision" />
          <Tile
            icon={CheckCircle2}
            value={counts.safe}
            label="Safe"
            detail="Small, uncontested — still needs a person"
          />
          <Tile
            icon={AlertTriangle}
            value={counts.review}
            label="Review"
            detail="Read these properly"
            tone={counts.review > 0 ? 'warn' : 'plain'}
          />
          <Tile
            icon={ShieldAlert}
            value={counts.highRisk}
            label="High risk"
            detail="Never bulk-approvable"
            tone={counts.highRisk > 0 ? 'danger' : 'plain'}
          />
        </div>

        <ReviewQueue
          rows={rows}
          counts={counts}
          active={{
            ...(risk ? { risk } : {}),
            ...(type ? { type } : {}),
            ...(searchParams.source ? { source: searchParams.source } : {}),
            ...(searchParams.car ? { car: searchParams.car } : {}),
            ...(searchParams.minConfidence ? { minConfidence: searchParams.minConfidence } : {}),
          }}
          sources={sources.map((source) => source.id)}
        />
      </div>
    </>
  )
}

function Tile({
  icon: Icon,
  value,
  label,
  detail,
  tone = 'plain',
}: {
  icon: LucideIcon
  value: number
  label: string
  detail: string
  tone?: 'plain' | 'warn' | 'danger'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-white p-4',
        tone === 'danger' ? 'border-red-200' : tone === 'warn' ? 'border-amber-200' : 'border-slate-200',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          size={15}
          aria-hidden="true"
          className={
            tone === 'danger' ? 'text-red-500' : tone === 'warn' ? 'text-amber-500' : 'text-slate-400'
          }
        />
        <p className="text-ui-xs font-semibold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      </div>
      <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-1 text-ui-xs leading-relaxed text-slate-500">{detail}</p>
    </div>
  )
}
