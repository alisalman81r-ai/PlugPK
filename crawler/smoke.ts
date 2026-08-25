// crawler/smoke.ts
//
// Step 1 of the crawler: prove Playwright can drive a real browser here.
//
// This is a smoke test, not a crawler. It answers one question — does the
// browser automation stack work on this machine, in this project — so that when
// the actual crawler fails later, that failure is about the site being crawled
// rather than about Playwright being half-installed.
//
// It deliberately does not scrape anything, does not touch Prisma, and does not
// import a single line of application code.
//
// Run:  npm run crawl:smoke
//       npm run crawl:smoke -- https://example.org      (any other URL)

import { chromium, type Browser } from '@playwright/test'

/**
 * The default target.
 *
 * example.com is reserved by IANA specifically for use in documentation and
 * testing, so pointing a browser at it raises no terms-of-service or rate-limit
 * question the way a real site would. It is also tiny and unusually stable,
 * which is what a smoke test wants: if this fails, the cause is here, not there.
 */
const DEFAULT_URL = 'https://example.com'

/** How long any single step may take before it is called a failure. */
const TIMEOUT_MS = 30_000

/** One checked step, so the output says which part broke rather than just "it broke". */
function report(ok: boolean, label: string, detail = ''): boolean {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  return ok
}

async function main(): Promise<number> {
  const url = process.argv[2] ?? DEFAULT_URL
  console.log(`\nPlaywright smoke test\n  target: ${url}\n`)

  /*
    Declared outside the try so `finally` can close it whichever step throws.

    A crawler that leaves chromium processes behind is the classic first bug of
    a project like this: they are headless, so nothing on screen says they are
    there, and after a few dozen runs the machine is quietly out of memory.
  */
  let browser: Browser | null = null
  let passed = 0
  let failed = 0

  const check = (ok: boolean, label: string, detail = '') => {
    if (report(ok, label, detail)) passed += 1
    else failed += 1
  }

  try {
    // ── 1. Launch ────────────────────────────────────────────────
    browser = await chromium.launch({ headless: true })
    check(browser.isConnected(), 'browser launches', `chromium ${browser.version()}`)

    const context = await browser.newContext({
      // Identifying the client honestly is the first courtesy a crawler owes a
      // site, and the first thing an operator looks for in their logs when
      // deciding whether to block something.
      userAgent:
        'PlugPK-crawler/0.1 (+https://plug.pk; contact: usman.ahmad@cybergen.ai) Playwright',
      viewport: { width: 1280, height: 800 },
    })
    const page = await context.newPage()

    // ── 2. Open the page ─────────────────────────────────────────
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS })
    const status = response?.status() ?? 0
    check(status >= 200 && status < 400, 'page opens', `HTTP ${status}`)

    // ── 3. Read the title ────────────────────────────────────────
    const title = await page.title()
    check(title.length > 0, 'title is readable', JSON.stringify(title))

    /*
      One DOM read as well as the title.

      `page.title()` alone would also succeed against a page that never rendered,
      since the title can come straight from the markup. Querying an element
      proves the browser actually built a DOM — which is the whole reason for
      using Playwright here rather than fetch().
    */
    const heading = await page.locator('h1').first().textContent({ timeout: TIMEOUT_MS })
    check(Boolean(heading?.trim()), 'DOM is queryable', `h1: ${JSON.stringify(heading?.trim())}`)

    await context.close()
  } catch (error) {
    check(false, 'run completed without throwing', error instanceof Error ? error.message : String(error))
  } finally {
    // ── 4. Close ─────────────────────────────────────────────────
    if (browser) {
      await browser.close()
      check(!browser.isConnected(), 'browser closes')
    }
  }

  console.log(`\n${failed === 0 ? 'ALL CHECKS PASSED' : `${failed} CHECK(S) FAILED`}  (${passed} passed)\n`)
  return failed === 0 ? 0 : 1
}

/*
  A non-zero exit on failure, so this is usable from CI or a shell `&&` chain
  later without anybody having to read the output to find out what happened.
*/
main()
  .then((code) => {
    process.exitCode = code
  })
  .catch((error: unknown) => {
    console.error('\nUnexpected failure:', error)
    process.exitCode = 1
  })
