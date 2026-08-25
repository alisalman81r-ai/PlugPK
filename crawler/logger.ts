// crawler/logger.ts

import { randomUUID } from 'node:crypto'

/**
 * Structured logging for a crawl, with redaction that is not optional.
 *
 * Two destinations: the console, so a person running the command can watch it,
 * and CrawlLogEntry, so the questions asked later — "what did this source do on
 * Tuesday", "which car has failed three mornings running" — are queries rather
 * than a grep on a machine nobody is sitting at.
 *
 * ── Why redaction lives here ──────────────────────────────────────────
 *
 * A log table is exactly where a credential leaks and stays. It is written by
 * the code path that is least carefully reviewed, read by the code path that is
 * most widely shared, and kept indefinitely. So nothing reaches either
 * destination without passing `redact()` — not the message, not an error, not a
 * URL.
 *
 * The rule is enforced at the single exit rather than trusted to each caller.
 * "Remember not to log the token" is a convention, and conventions are broken by
 * whoever adds a source at eleven at night.
 */

/**
 * Patterns that look like a secret.
 *
 * Deliberately over-broad. A redacted field that was harmless costs a reader one
 * moment of confusion; a token written in clear costs a rotation and an
 * apology, and it is usually only noticed by accident.
 */
const SECRET_PATTERNS: { pattern: RegExp; replace: string }[] = [
  // key=…, token: …, secret => …, password "…" — any separator, quoted or not.
  {
    pattern:
      /\b(api[_-]?key|apikey|access[_-]?token|auth[_-]?token|bearer|secret|password|passwd|pwd|client[_-]?secret|private[_-]?key|session[_-]?token|refresh[_-]?token)\b\s*[:=>]*\s*["']?([A-Za-z0-9._\-+/=]{4,})["']?/gi,
    replace: '$1=[redacted]',
  },
  // Authorization headers, whatever the scheme.
  { pattern: /\bauthorization\b\s*[:=]\s*\S+/gi, replace: 'authorization=[redacted]' },
  // Credentials embedded in a URL: https://user:pass@host
  { pattern: /(\bhttps?:\/\/)[^/\s:@]+:[^/\s@]+@/gi, replace: '$1[redacted]@' },
  // Query-string credentials, which survive URL logging most often of all.
  {
    pattern:
      /([?&](?:key|token|api_key|apikey|access_token|secret|password|sig|signature)=)[^&\s]+/gi,
    replace: '$1[redacted]',
  },
  // Recognisable token shapes, independent of any surrounding label.
  { pattern: /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g, replace: '[redacted-github-token]' },
  { pattern: /\bsk-[A-Za-z0-9]{16,}\b/g, replace: '[redacted-key]' },
  { pattern: /\bAKIA[0-9A-Z]{12,}\b/g, replace: '[redacted-aws-key]' },
  // A JWT is three base64url segments; the middle one carries the claims.
  {
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
    replace: '[redacted-jwt]',
  },
]

/** Strips anything that looks like a credential out of a string. */
export function redact(value: string): string {
  let out = value
  for (const { pattern, replace } of SECRET_PATTERNS) {
    out = out.replace(pattern, replace)
  }
  return out
}

/**
 * Key names whose value is replaced whatever it looks like.
 *
 * Checked as well as the value, because a short opaque token matches no pattern
 * and is no less a token for it.
 */
const SECRET_KEYS =
  /^(authorization|cookie|set-cookie|api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|password|passwd|pwd|private[_-]?key|credentials?)$/i

/** Redacts recursively, so a nested `headers.authorization` cannot slip past. */
export function redactDeep(input: unknown, depth = 0): unknown {
  if (depth > 6) return '[too deep]'
  if (typeof input === 'string') return redact(input)
  if (input === null || typeof input !== 'object') return input
  if (Array.isArray(input)) return input.map((entry) => redactDeep(entry, depth + 1))

  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    out[key] = SECRET_KEYS.test(key) ? '[redacted]' : redactDeep(value, depth + 1)
  }
  return out
}

export type Operation =
  | 'fetch'
  | 'normalise'
  | 'match'
  | 'compare'
  | 'propose'
  | 'discover'
  | 'skip'
  | 'error'

export type LogStatus = 'ok' | 'unchanged' | 'changed' | 'failed' | 'blocked' | 'skipped'

export interface LogLine {
  runId: string
  sourceId: string
  operation: Operation
  status: LogStatus
  message?: string | undefined
  carId?: string | null | undefined
  durationMs?: number | undefined
}

export interface LoggerOptions {
  /** When false, nothing is written to the database — used by dry runs and tests. */
  persist?: boolean
  /** When false, nothing is printed. */
  echo?: boolean
}

/**
 * Collects log lines and flushes them in batches.
 *
 * Batched because a run over five thousand cars would otherwise be five thousand
 * separate inserts against a single-writer SQLite file, and the logging would
 * cost more than the crawling. Flushed at every boundary, so a crash still
 * leaves behind the lines that explain it.
 */
export class CrawlLogger {
  private buffer: (LogLine & { id: string; createdAt: Date })[] = []
  private readonly persist: boolean
  private readonly echo: boolean
  private counts = new Map<string, number>()

  constructor(options: LoggerOptions = {}) {
    this.persist = options.persist ?? true
    this.echo = options.echo ?? true
  }

  /** One line. The message is redacted before it goes anywhere at all. */
  log(line: LogLine): void {
    const message = line.message === undefined ? undefined : redact(line.message)
    const key = `${line.operation}:${line.status}`
    this.counts.set(key, (this.counts.get(key) ?? 0) + 1)

    if (this.echo) {
      const stamp = `${line.operation}/${line.status}`
      console.log(
        `    ${stamp.padEnd(20)} ${line.sourceId.padEnd(10)} ${message ?? ''}` +
          (line.durationMs !== undefined ? ` (${line.durationMs}ms)` : ''),
      )
    }

    if (!this.persist) return

    this.buffer.push({ ...line, message, id: randomUUID(), createdAt: new Date() })

    // 200 rows of this width sits well inside SQLite's parameter ceiling.
    if (this.buffer.length >= 200) void this.flush()
  }

  /** Logs a failure without letting the error's own text carry a secret out. */
  error(base: Omit<LogLine, 'status' | 'message'>, error: unknown): void {
    const message = error instanceof Error ? error.message : String(error)
    this.log({ ...base, status: 'failed', message })
  }

  async flush(): Promise<number> {
    if (this.buffer.length === 0) return 0
    const batch = this.buffer
    this.buffer = []

    if (!this.persist) return batch.length

    const { prisma } = await import('../src/lib/db/client')
    await prisma.crawlLogEntry.createMany({
      data: batch.map((line) => ({
        id: line.id,
        runId: line.runId,
        sourceId: line.sourceId,
        carId: line.carId ?? null,
        operation: line.operation,
        status: line.status,
        message: line.message ?? null,
        durationMs: line.durationMs ?? null,
        createdAt: line.createdAt,
      })),
    })
    return batch.length
  }

  /** Tallies by operation and status, for the run summary. */
  summary(): Record<string, number> {
    return Object.fromEntries([...this.counts.entries()].sort())
  }
}
