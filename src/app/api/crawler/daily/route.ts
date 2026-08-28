import { NextResponse, type NextRequest } from 'next/server'

import {
  getTriggerConfigError,
  isCrawlerTriggerEnabled,
  verifyTriggerAuth,
} from '@/lib/crawler-trigger'

/**
 * The externally-triggerable daily crawl.
 *
 *   POST /api/crawler/daily
 *   Authorization: Bearer $CRAWLER_TRIGGER_SECRET
 *   { "dry": true, "budget": 200 }
 *
 * Runs exactly the same code as `npm run crawl:daily` — crawler/pipeline.ts,
 * through crawler/live-deps.ts. There is deliberately no second implementation:
 * an endpoint that crawled slightly differently from the command would be the one
 * running unattended, and the difference would be found by a wrong figure on the
 * public site rather than by anybody reading this file.
 *
 * ── Node runtime, and why that is not negotiable ──────────────────────
 *
 * The pipeline imports Prisma and reaches the filesystem-backed SQLite database.
 * That rules out the Edge runtime, and it also rules out any deployment where the
 * filesystem is ephemeral — see docs/CRAWLER.md, which is blunt about the fact
 * that this project has no deployment target yet and that a serverless one would
 * not work for writes at all.
 *
 * ── Not switched on ───────────────────────────────────────────────────
 *
 * With CRAWLER_ENABLED unset this route 404s, exactly like a path that was never
 * built. That is the activation switch, and turning it on is the operator's
 * decision to make after reading the production-safety report.
 */

// Prisma and node:crypto. Neither exists on the Edge runtime.
export const runtime = 'nodejs'
// A crawl must never be served from a cache, and never prerendered at build.
export const dynamic = 'force-dynamic'

/**
 * One run at a time, per process.
 *
 * An external scheduler that retries on timeout will happily fire this twice, and
 * two concurrent runs against one SQLite file means two writers, two sets of
 * staging rows for the same morning, and a race on each source's health row. The
 * second caller is told the first is still going rather than being queued: a
 * queued crawl that starts twenty minutes late is indistinguishable from one that
 * hung, and it would still be holding the connection when the scheduler gave up
 * and fired a third.
 *
 * Per process, which is honest about its limits: it does not protect against two
 * processes, and nothing here can. The `unfinishedRuns` panel on
 * /admin/cars/updates is what surfaces that if it ever happens.
 */
let inFlight: Promise<unknown> | null = null

interface TriggerBody {
  /** Report without writing. Defaults to false — a trigger is meant to do work. */
  dry?: boolean
  /** Cap on records processed per source. 0 or absent for the source's own. */
  budget?: number
  /** One source, ignoring its cadence. Absent means every source that is due. */
  source?: string
}

async function readBody(request: NextRequest): Promise<TriggerBody> {
  /*
    An unparseable body is treated as an empty one rather than an error.

    The common caller here is a scheduler's "make a POST request" box, which sends
    no body at all, and failing that request would mean the endpoint only worked
    for callers who knew to send `{}`.
  */
  try {
    const parsed: unknown = await request.json()
    return parsed !== null && typeof parsed === 'object' ? (parsed as TriggerBody) : {}
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  /*
    404, not 403, when the switch is off.

    The same reasoning as the admin middleware: a 403 confirms the endpoint
    exists and invites somebody to come back with a token, while a 404 makes a
    build with crawling disabled indistinguishable from one where the route was
    never compiled.
  */
  if (!isCrawlerTriggerEnabled()) {
    return new NextResponse('Not found', { status: 404 })
  }

  const configError = getTriggerConfigError()
  if (configError) {
    /*
      A misconfiguration is reported to the caller, because the caller is the
      operator's own scheduler and it is the only place they will see it. The
      message names the variable and never its value.
    */
    return NextResponse.json(
      { ok: false, error: `The crawler trigger is not configured: ${configError}` },
      { status: 503 },
    )
  }

  if (!verifyTriggerAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 })
  }

  if (inFlight) {
    return NextResponse.json(
      { ok: false, error: 'A crawl is already running in this process.' },
      { status: 409 },
    )
  }

  const body = await readBody(request)

  /*
    Imported here, not at module scope.

    These pull in the whole crawler and the Prisma client. At module scope they
    would be loaded when the route file is first evaluated — which happens during
    `next build` — and a build should not import a crawler to compile a route that
    is switched off.
  */
  const { liveDeps } = await import('@crawler/live-deps')
  const { runDaily } = await import('@crawler/pipeline')
  const { summariseReport } = await import('@crawler/report')

  try {
    const deps = await liveDeps()

    const run = runDaily(deps, {
      mode: body.source ? 'named' : 'scheduled',
      source: body.source ?? null,
      only: [],
      dry: body.dry === true,
      limit: 0,
      budget: typeof body.budget === 'number' && body.budget > 0 ? Math.trunc(body.budget) : 0,
      /*
        Recorded as scheduled even when a source is named.

        A request arriving at this endpoint came from a timer, whoever configured
        it. Calling it manual would put the one class of run nobody watched into
        the same bucket as the ones somebody was sitting in front of.
      */
      trigger: 'scheduled',
    })

    inFlight = run
    const report = await run

    return NextResponse.json({ ok: true, dry: body.dry === true, ...summariseReport(report) })
  } catch (error) {
    /*
      The pipeline isolates per-source failures itself, so reaching here means
      something structural went wrong — the database is gone, or a dependency
      could not be built. Logged server-side in full; the response carries only
      the message, because the response goes to a third-party scheduler's log.
    */
    console.error('[crawler] daily trigger failed', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'The run failed.' },
      { status: 500 },
    )
  } finally {
    inFlight = null
  }
}

/**
 * Everything else is refused, including GET.
 *
 * A crawl changes server state, and a GET that mutates is followed by link
 * prefetchers, security scanners and anything that walks a sitemap. So GET never
 * runs anything.
 *
 * ── The enable gate is checked here too ──────────────────────────────
 *
 * It was not, and that undid the point of the gate. POST returned 404 while the
 * crawler was switched off, but GET returned 405 — and a 405 says "this path
 * exists and takes a different verb", which is exactly the fact the 404 on POST
 * was hiding. Anyone probing the URL learned that a crawler endpoint was there
 * and worth coming back to with a token.
 *
 * A disabled build now answers 404 to every method, indistinguishable from one
 * where this file was never compiled. 405 is reserved for the case where the
 * endpoint really is available and the caller used the wrong verb.
 */
export async function GET() {
  if (!isCrawlerTriggerEnabled()) {
    return new NextResponse('Not found', { status: 404 })
  }

  return new NextResponse('Method not allowed. Use POST.', {
    status: 405,
    headers: { Allow: 'POST' },
  })
}
