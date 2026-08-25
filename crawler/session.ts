// crawler/session.ts

import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'

/**
 * One browser, many pages.
 *
 * Launching chromium costs roughly a second and a hundred megabytes. Doing that
 * per URL is the difference between a crawl that takes a minute and one that
 * takes twenty, so the browser is opened once and every page borrows it.
 *
 * Everything here is mechanism. Nothing in this file knows what a car is — the
 * per-site rules live in their own module, so a change to one site cannot break
 * the fetching for another.
 */

/** Identifies the crawler honestly, with a way to reach whoever runs it. */
const USER_AGENT =
  'PlugPK-crawler/0.1 (+https://plug.pk; contact: usman.ahmad@cybergen.ai) Playwright'

export interface SessionOptions {
  /** Per-navigation timeout. */
  timeoutMs?: number
  /**
   * Pause between navigations.
   *
   * Not a performance setting — a courtesy one. Hammering a site as fast as a
   * headless browser can go is how a crawler gets blocked, and rightly.
   */
  delayMs?: number
  /** Attempts per page, including the first. */
  retries?: number
}

const DEFAULTS = { timeoutMs: 30_000, delayMs: 750, retries: 3 } as const

export interface FetchedPage {
  page: Page
  status: number
  url: string
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class CrawlSession {
  private browser: Browser | null = null
  private context: BrowserContext | null = null
  private readonly options: Required<SessionOptions>
  /** Wall-clock of the last navigation, so the delay is between requests. */
  private lastFetchAt = 0

  constructor(options: SessionOptions = {}) {
    this.options = { ...DEFAULTS, ...options }
  }

  async open(): Promise<void> {
    this.browser = await chromium.launch({ headless: true })
    this.context = await this.browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 900 },
    })
    this.context.setDefaultTimeout(this.options.timeoutMs)
  }

  /**
   * Fetches one page, retrying on transient failure.
   *
   * Retries with a widening gap rather than immediately: the usual causes —
   * a timeout, a 502, a dropped connection — are exactly the ones that a
   * moment's wait fixes and an instant retry makes worse.
   *
   * The caller gets the live `Page` rather than its HTML, because the reason to
   * use a browser at all is to read a DOM that JavaScript built. It is the
   * caller's job to close it.
   */
  async fetch(url: string): Promise<FetchedPage> {
    if (!this.context) throw new Error('CrawlSession.open() was not called')

    const sinceLast = Date.now() - this.lastFetchAt
    if (this.lastFetchAt > 0 && sinceLast < this.options.delayMs) {
      await sleep(this.options.delayMs - sinceLast)
    }

    let lastError: unknown = null

    for (let attempt = 1; attempt <= this.options.retries; attempt += 1) {
      const page = await this.context.newPage()
      try {
        const response = await page.goto(url, {
          // `domcontentloaded`, not `networkidle`: a page with a live map, an
          // analytics beacon or a poll never goes idle, and waiting for it to
          // would hang every fetch until the timeout.
          waitUntil: 'domcontentloaded',
          timeout: this.options.timeoutMs,
        })
        const status = response?.status() ?? 0
        this.lastFetchAt = Date.now()

        if (status >= 400) {
          await page.close()
          throw new Error(`HTTP ${status}`)
        }

        return { page, status, url }
      } catch (error) {
        lastError = error
        await page.close().catch(() => undefined)
        this.lastFetchAt = Date.now()
        if (attempt < this.options.retries) await sleep(this.options.delayMs * attempt * 2)
      }
    }

    throw new Error(
      `${url} failed after ${this.options.retries} attempts: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`,
    )
  }

  /**
   * Closes everything, and can be called twice.
   *
   * Idempotent on purpose: this belongs in a `finally`, and a close that throws
   * because it already ran would mask whatever sent the code there.
   */
  async close(): Promise<void> {
    await this.context?.close().catch(() => undefined)
    await this.browser?.close().catch(() => undefined)
    this.context = null
    this.browser = null
  }
}
