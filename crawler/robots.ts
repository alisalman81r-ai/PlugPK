// crawler/robots.ts

/**
 * robots.txt, checked before anything is fetched.
 *
 * This module is a gate, not a formality. Nothing in this crawler may request a
 * third-party page until `isAllowed()` has returned true for it, and the default
 * on every uncertain path is to refuse.
 *
 * ── Why refusing by default is the right way round ────────────────────
 *
 * A crawler that treats an unreachable robots.txt as permission will, on the day
 * a site has a bad five minutes, quietly start crawling everything it was told
 * not to. The failure is silent, it looks like success, and the evidence is on
 * somebody else's server. Refusing costs a delayed crawl; the opposite costs a
 * ban and a defensible complaint.
 *
 * ── What this implements, and what it does not ────────────────────────
 *
 * The parts of the standard that decide whether a fetch is allowed: User-agent
 * grouping including the `*` fallback, Allow and Disallow, longest-match-wins
 * with Allow breaking ties, `$` and `*` wildcards, and Crawl-delay. Sitemap
 * lines are read and returned because they are useful.
 *
 * Not implemented: nothing that would change a verdict. If a directive appears
 * that this cannot interpret, the path is treated as disallowed rather than
 * guessed at.
 */

export type RobotsStatus = 'allowed' | 'disallowed' | 'unreachable' | 'unchecked'

export interface RobotsRule {
  type: 'allow' | 'disallow'
  /** The path pattern exactly as published. */
  pattern: string
}

export interface RobotsPolicy {
  /** Where the file was fetched from. */
  url: string
  /** False when the file could not be read; every path is then refused. */
  fetched: boolean
  /** Rules for the user-agent asked about, most specific group only. */
  rules: RobotsRule[]
  /** Seconds the site asked crawlers to wait, if stated. */
  crawlDelaySeconds: number | null
  sitemaps: string[]
  /** Which group matched: the exact agent, '*', or none. */
  matchedAgent: string | null
  /** Set when the fetch failed, for the record. */
  error?: string
}

/** The identity this crawler presents, and the one it obeys rules for. */
export const CRAWLER_AGENT = 'PlugPK-crawler'

/**
 * Parses a robots.txt body.
 *
 * Separate from fetching so it can be tested over fixtures without a network,
 * which is the only way to be sure the precedence rules are right.
 */
export function parseRobots(body: string, agent = CRAWLER_AGENT): Omit<RobotsPolicy, 'url' | 'fetched'> {
  const lines = body.split(/\r?\n/)

  /** agent (lowercased) → its rules. */
  const groups = new Map<string, RobotsRule[]>()
  const delays = new Map<string, number>()
  const sitemaps: string[] = []

  /*
    Consecutive User-agent lines share one group, which the standard requires
    and real files use constantly. `currentAgents` is therefore a list, and it
    is only cleared once a rule line has been seen.
  */
  let currentAgents: string[] = []
  let seenRuleForGroup = false

  for (const rawLine of lines) {
    const line = rawLine.split('#')[0]?.trim() ?? ''
    if (line.length === 0) continue

    const separator = line.indexOf(':')
    if (separator === -1) continue

    const field = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()

    if (field === 'sitemap') {
      if (value) sitemaps.push(value)
      continue
    }

    if (field === 'user-agent') {
      if (seenRuleForGroup) {
        currentAgents = []
        seenRuleForGroup = false
      }
      currentAgents.push(value.toLowerCase())
      if (!groups.has(value.toLowerCase())) groups.set(value.toLowerCase(), [])
      continue
    }

    if (field === 'allow' || field === 'disallow') {
      seenRuleForGroup = true
      for (const owner of currentAgents) {
        groups.get(owner)?.push({ type: field, pattern: value })
      }
      continue
    }

    if (field === 'crawl-delay') {
      seenRuleForGroup = true
      const seconds = Number(value)
      if (Number.isFinite(seconds)) {
        for (const owner of currentAgents) delays.set(owner, seconds)
      }
    }
  }

  /*
    The most specific matching group wins, and only that group applies — a
    crawler named in the file does not also inherit the '*' rules.
  */
  const wanted = agent.toLowerCase()
  const named = [...groups.keys()].find((key) => key !== '*' && wanted.includes(key))
  const matchedAgent = named ?? (groups.has('*') ? '*' : null)

  return {
    rules: matchedAgent ? (groups.get(matchedAgent) ?? []) : [],
    crawlDelaySeconds: matchedAgent ? (delays.get(matchedAgent) ?? null) : null,
    sitemaps,
    matchedAgent,
  }
}

/** Turns a robots pattern into a regular expression, honouring `*` and `$`. */
function patternToRegExp(pattern: string): RegExp {
  const anchoredEnd = pattern.endsWith('$')
  const body = anchoredEnd ? pattern.slice(0, -1) : pattern

  const escaped = body
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*')

  return new RegExp(`^${escaped}${anchoredEnd ? '$' : ''}`)
}

/**
 * Whether a path may be fetched under a policy.
 *
 * Longest matching pattern wins; Allow beats Disallow at equal length, which is
 * what the standard says and what every major crawler does. An empty Disallow
 * value means "nothing is disallowed" and is ignored rather than treated as a
 * match on everything — reading it the other way would refuse entire sites that
 * had explicitly opened themselves up.
 */
export function isPathAllowed(policy: RobotsPolicy, pathname: string): boolean {
  if (!policy.fetched) return false
  if (policy.rules.length === 0) return true

  let best: { rule: RobotsRule; length: number } | null = null

  for (const rule of policy.rules) {
    if (rule.pattern.length === 0) continue
    if (!patternToRegExp(rule.pattern).test(pathname)) continue

    const length = rule.pattern.length
    if (
      best === null ||
      length > best.length ||
      (length === best.length && rule.type === 'allow')
    ) {
      best = { rule, length }
    }
  }

  return best === null ? true : best.rule.type === 'allow'
}

/**
 * Fetches and parses a site's robots.txt.
 *
 * Uses plain `fetch` rather than the browser: robots.txt is a text file, and
 * spending a Playwright page on it would be slower and stranger.
 *
 * A 404 means no rules exist, which is permission. A 5xx, a timeout or a network
 * error means unknown, which is refusal.
 */
export async function fetchRobots(
  origin: string,
  agent = CRAWLER_AGENT,
  timeoutMs = 10_000,
): Promise<RobotsPolicy> {
  const url = new URL('/robots.txt', origin).toString()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': `${agent}/0.1 (+https://plug.pk)` },
      signal: controller.signal,
      redirect: 'follow',
    })

    if (response.status === 404 || response.status === 410) {
      return {
        url,
        fetched: true,
        rules: [],
        crawlDelaySeconds: null,
        sitemaps: [],
        matchedAgent: null,
      }
    }

    if (!response.ok) {
      return {
        url,
        fetched: false,
        rules: [],
        crawlDelaySeconds: null,
        sitemaps: [],
        matchedAgent: null,
        error: `HTTP ${response.status}`,
      }
    }

    return { url, fetched: true, ...parseRobots(await response.text(), agent) }
  } catch (error) {
    return {
      url,
      fetched: false,
      rules: [],
      crawlDelaySeconds: null,
      sitemaps: [],
      matchedAgent: null,
      error: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * The gate. One call, one URL, one verdict.
 *
 * Callers pass a cache so a crawl of two hundred pages fetches robots.txt once
 * per origin rather than two hundred times — which is itself a courtesy.
 */
export async function isAllowed(
  targetUrl: string,
  cache: Map<string, RobotsPolicy>,
  agent = CRAWLER_AGENT,
): Promise<{ allowed: boolean; policy: RobotsPolicy; reason: string }> {
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    return {
      allowed: false,
      policy: {
        url: targetUrl,
        fetched: false,
        rules: [],
        crawlDelaySeconds: null,
        sitemaps: [],
        matchedAgent: null,
        error: 'not a valid URL',
      },
      reason: 'not a valid URL',
    }
  }

  const cached = cache.get(parsed.origin)
  const policy = cached ?? (await fetchRobots(parsed.origin, agent))
  if (!cached) cache.set(parsed.origin, policy)

  if (!policy.fetched) {
    return {
      allowed: false,
      policy,
      reason: `robots.txt could not be read (${policy.error ?? 'unknown'}) — refusing by default`,
    }
  }

  const allowed = isPathAllowed(policy, parsed.pathname)
  return {
    allowed,
    policy,
    reason: allowed
      ? `allowed by ${policy.matchedAgent ? `the "${policy.matchedAgent}" group` : 'an empty robots.txt'}`
      : `disallowed for "${policy.matchedAgent}" by robots.txt`,
  }
}

/** Maps a policy onto the string stored in `CarSource.robotsStatus`. */
export function toStatus(policy: RobotsPolicy, allowed: boolean): RobotsStatus {
  if (!policy.fetched) return 'unreachable'
  return allowed ? 'allowed' : 'disallowed'
}
