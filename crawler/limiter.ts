// crawler/limiter.ts

/**
 * Politeness, enforced rather than intended.
 *
 * Concurrency, spacing, timeout and backoff live here so no adapter has to
 * remember them. An adapter that forgets to pause is not a slightly rude
 * adapter — it is the one that gets the whole project's IP blocked, and the
 * block arrives without warning and applies to every source on the host.
 *
 * The numbers are conservative on purpose. A daily crawl has twenty-four hours
 * to finish; there is nothing to gain from being fast and a real cost to being
 * noticed.
 */

export interface LimiterOptions {
  /** Requests in flight at once, per limiter. */
  concurrency?: number
  /** Minimum gap between the *starts* of two requests. */
  minDelayMs?: number
  /** Per-attempt ceiling. */
  timeoutMs?: number
  /** Attempts including the first. */
  maxRetries?: number
}

const DEFAULTS = {
  /*
    One at a time by default.

    A crawler is not a load test. Two concurrent requests to the same host halve
    the wall clock and double the chance of looking like an attack, and the wall
    clock does not matter here.
  */
  concurrency: 1,
  minDelayMs: 1_500,
  timeoutMs: 30_000,
  maxRetries: 3,
} as const

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Which failures are worth trying again. */
export function isRetryable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)

  /*
    A 4xx is not retried. It means the request was wrong — not found, forbidden,
    rate-limited by policy — and repeating it changes nothing except the host's
    opinion of us. 429 is the exception: it explicitly asks us to wait.
  */
  if (/\b(400|401|403|404|410|451)\b/.test(message)) return false

  return (
    /\b(429|500|502|503|504)\b/.test(message) ||
    /timeout|timed out|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up|fetch failed/i.test(message)
  )
}

export interface AttemptLog {
  attempt: number
  ms: number
  ok: boolean
  error?: string
}

export interface RunResult<T> {
  value: T
  attempts: AttemptLog[]
  /** Total wall time across every attempt. */
  totalMs: number
}

/**
 * One limiter per source.
 *
 * Per-source rather than global, because each host's policy is its own: a
 * published dataset can take one request every second and a small site should
 * get one every five. A single global limiter would either be too slow for the
 * generous host or too fast for the fragile one.
 */
export class RateLimiter {
  private readonly options: Required<LimiterOptions>
  private active = 0
  private lastStartedAt = 0
  private queue: (() => void)[] = []

  constructor(options: LimiterOptions = {}) {
    this.options = { ...DEFAULTS, ...options }
  }

  private async acquire(): Promise<void> {
    if (this.active >= this.options.concurrency) {
      await new Promise<void>((resolve) => this.queue.push(resolve))
    }
    this.active += 1

    const since = Date.now() - this.lastStartedAt
    if (this.lastStartedAt > 0 && since < this.options.minDelayMs) {
      await sleep(this.options.minDelayMs - since)
    }
    this.lastStartedAt = Date.now()
  }

  private release(): void {
    this.active -= 1
    const next = this.queue.shift()
    if (next) next()
  }

  /**
   * Runs one task under the limiter, retrying what is worth retrying.
   *
   * The backoff is exponential with jitter. Without jitter, several sources
   * failing at once retry in lockstep forever — they were started together, so
   * they back off together, and the thundering herd never disperses.
   */
  async run<T>(task: (signal: AbortSignal) => Promise<T>): Promise<RunResult<T>> {
    const attempts: AttemptLog[] = []
    const startedAt = Date.now()
    let lastError: unknown = null

    for (let attempt = 1; attempt <= this.options.maxRetries; attempt += 1) {
      await this.acquire()
      const attemptStart = Date.now()
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), this.options.timeoutMs)

      try {
        const value = await task(controller.signal)
        attempts.push({ attempt, ms: Date.now() - attemptStart, ok: true })
        return { value, attempts, totalMs: Date.now() - startedAt }
      } catch (error) {
        lastError = error
        const message = error instanceof Error ? error.message : String(error)
        attempts.push({ attempt, ms: Date.now() - attemptStart, ok: false, error: message })

        if (!isRetryable(error) || attempt === this.options.maxRetries) break

        // 2s, 4s, 8s… plus up to a second of jitter.
        const wait = 2 ** attempt * 1000 + Math.floor(Math.random() * 1000)
        await sleep(wait)
      } finally {
        clearTimeout(timer)
        this.release()
      }
    }

    const error = new Error(
      `failed after ${attempts.length} attempt(s): ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    )
    // Attached so the caller can log the shape of the failure, not just the last line.
    ;(error as Error & { attempts?: AttemptLog[] }).attempts = attempts
    throw error
  }
}

/** Limiters, one per source, reused across a run. */
const limiters = new Map<string, RateLimiter>()

export function limiterFor(sourceId: string, options: LimiterOptions = {}): RateLimiter {
  const existing = limiters.get(sourceId)
  if (existing) return existing

  const limiter = new RateLimiter(options)
  limiters.set(sourceId, limiter)
  return limiter
}
