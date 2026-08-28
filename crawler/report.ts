// crawler/report.ts

/**
 * Turning a run report into text.
 *
 * Separated from daily.ts so the HTTP trigger can return the same summary a
 * person sees in a terminal, and so the formatting is not mixed in with the
 * orchestration. A scheduled job's output is read exactly once — in an email or a
 * log, by somebody deciding whether to worry — so what it says and the order it
 * says it in is part of the safety of the thing, not decoration.
 */

import { grade, type HealthState } from './health'
import { CADENCES, toCadence } from './schedule'
import type { PlanEntry, RunReport, SourceResult, SourceRow } from './pipeline'

/** What runs and why, before anything is contacted. */
export function formatSchedule(plan: PlanEntry[]): string {
  const lines: string[] = ['\nSchedule']

  for (const entry of plan) {
    const cadence = toCadence(entry.source.schedule)
    lines.push(
      `  ${entry.source.id.padEnd(10)} ${CADENCES[cadence].label.padEnd(14)} ` +
        `${entry.health.grade.padEnd(10)} ${entry.run ? 'RUN ' : 'skip'} — ${entry.reason}`,
    )
    if (entry.health.grade !== 'healthy' && entry.health.summary) {
      lines.push(`             ${entry.health.grade}: ${entry.health.summary}`)
    }
  }

  return lines.join('\n')
}

const OUTCOME_LABEL: Record<SourceResult['outcome'], string> = {
  completed: 'completed',
  partial: 'PARTIAL',
  failed: 'FAILED',
  blocked: 'blocked',
  skipped: 'skipped',
  'not-modified': 'not modified',
}

/** One source's outcome, in the detail an operator needs to act. */
export function formatSourceResult(result: SourceResult): string {
  const lines: string[] = [`\n${result.sourceId} — ${OUTCOME_LABEL[result.outcome]}`]

  if (result.runId) lines.push(`  run ${result.runId}`)

  for (const note of result.notes) lines.push(`  ${note}`)

  if (result.outcome !== 'skipped' && result.outcome !== 'blocked') {
    lines.push(
      `  found ${result.totals.found}, ` +
        `new/changed ${result.totals.stored}, ` +
        `unchanged ${result.totals.unchanged}, ` +
        `failed ${result.totals.failed}, ` +
        `deferred ${result.totals.deferred}`,
    )
    lines.push(
      `  ${result.totals.matched} matched a catalogue car, ` +
        `${result.totals.candidates} candidate(s), ` +
        `${result.totals.proposed} proposal(s) (${result.totals.highRisk} high-risk), ` +
        `${result.totals.prices} price point(s)`,
    )

    const priorities = Object.entries(result.priorityCounts)
      .filter(([, count]) => count > 0)
      .map(([priority, count]) => `${count} ${priority}`)
    if (priorities.length > 0) lines.push(`  records by priority: ${priorities.join(', ')}`)
  }

  /*
    Every error is printed, not just the first.

    A run that failed on eleven records for eleven different reasons is a
    different problem from one that failed eleven times for the same reason, and
    the summary line cannot tell them apart. Capped at ten so one broken source
    cannot bury the rest of the report.
  */
  for (const error of result.errors.slice(0, 10)) lines.push(`  error: ${error}`)
  if (result.errors.length > 10) {
    lines.push(`  ...and ${result.errors.length - 10} more error(s) — see the run log`)
  }

  return lines.join('\n')
}

/**
 * Names every source whose data is older than it should be.
 *
 * Printed at the end of every run, including runs where nothing was due, because
 * the failure this catches is silence: a source that stopped working three weeks
 * ago produces no errors at all, and the only evidence is a timestamp nobody
 * looks at. Staleness never removes data — an outage must not empty a catalogue.
 */
export function formatStale(
  sources: (SourceRow | (HealthState & { id: string; name: string; schedule: string; isEnabled: boolean; robotsStatus: string; staleAfterDays: number }))[],
  now: Date,
): string {
  const attention = sources
    .map((source) => ({ source, report: grade({ ...source, now }) }))
    .filter((entry) => entry.report.grade !== 'healthy')

  if (attention.length === 0) return '\nEvery source is current.'

  const lines: string[] = ['\nNeeds attention']
  for (const { source, report } of attention) {
    lines.push(`  ${source.id.padEnd(10)} ${report.grade.padEnd(10)} ${report.summary}`)
    if (report.detail) lines.push(`             ${report.detail}`)
  }
  return lines.join('\n')
}

/** The whole run. */
export function formatReport(report: RunReport): string {
  const lines: string[] = []

  for (const result of report.results) lines.push(formatSourceResult(result))

  const seconds = (report.durationMs / 1000).toFixed(1)
  const totals = report.totals

  lines.push(
    `\nDone in ${seconds}s` +
      `\n  fetched     ${totals.found}` +
      `\n  new/changed ${totals.stored}` +
      `\n  unchanged   ${totals.unchanged}   (skipped without re-storing)` +
      `\n  failed      ${totals.failed}` +
      `\n  deferred    ${totals.deferred}   (budget reached; next run takes them first)` +
      `\n  matched     ${totals.matched} record(s) about a car the catalogue carries` +
      `\n  proposals   ${totals.proposed} awaiting review (${totals.highRisk} high-risk)` +
      `\n  candidates  ${totals.candidates} possible new cars` +
      `\n  prices      ${totals.prices} points recorded` +
      `\n  images      ${totals.images} candidates recorded (none downloaded)`,
  )

  lines.push(formatStale(report.plan.map((entry) => entry.source), report.startedAt))

  return lines.join('\n')
}

/**
 * A compact object for the HTTP trigger's JSON response.
 *
 * Deliberately not the whole report. A trigger response goes into an external
 * scheduler's log, which may be a third-party service — so it carries counts and
 * outcomes, and no source URLs, no error text and nothing a record contained.
 */
export function summariseReport(report: RunReport): Record<string, unknown> {
  return {
    startedAt: report.startedAt.toISOString(),
    durationMs: report.durationMs,
    sourcesPlanned: report.plan.length,
    sourcesRun: report.results.length,
    outcomes: report.results.reduce<Record<string, number>>((counts, result) => {
      counts[result.outcome] = (counts[result.outcome] ?? 0) + 1
      return counts
    }, {}),
    totals: report.totals,
    attention: report.attention.length,
    cars: report.carsAfter,
  }
}
