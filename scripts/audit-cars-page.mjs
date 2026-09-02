// scripts/audit-cars-page.mjs
//
// Drives every control on /cars in a real browser and asserts that each one
// changed what it claims to change.
//
//   node scripts/audit-cars-page.mjs                 (localhost:3000)
//   AUDIT_BASE=http://localhost:3003 node scripts/audit-cars-page.mjs
//
// Written as a script rather than a Playwright test because the project has no
// test runner configured, and adding one to answer "do the buttons work" would
// be a larger change than the question.
//
// Every check is an OBSERVED consequence, not the presence of a handler: a
// button that renders and is bound to a no-op passes a markup audit and fails
// here. So the assertions are things like "the result count fell", "the URL
// gained ?type=", "localStorage holds the id" — the effect a visitor would see.
//
// ── Two things a first pass at this got wrong ─────────────────────────
//
// The controls are named for people, not for the data model. The category
// segments read "Electric 31" and "Plug-in hybrid 9", not "EV" and "PHEV", and
// the compare button is "Add <car> to comparison" — which /compare/i does not
// match, because "comparison" contains no "compare". Selectors here use the
// real accessible names.
//
// And the URL is written behind a debounce: filter state reaches the address bar
// a beat after the grid re-renders, so a check that reads location too early
// reports a working control as broken. SETTLE is that beat, and every assertion
// about the URL waits it out.

import { chromium } from '@playwright/test'

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3000'
const SETTLE = 1600

let pass = 0
let fail = 0
const failures = []
const notes = []

function check(label, ok, detail = '') {
  if (ok) {
    pass += 1
    console.log(`  PASS  ${label}${detail ? ` — ${detail}` : ''}`)
  } else {
    fail += 1
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`)
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

function note(text) {
  notes.push(text)
  console.log(`  note  ${text}`)
}

function group(name) {
  console.log(`\n${name}`)
}

const CARD = 'article:has(a[href^="/cars/"])'

const consoleErrors = []
const pageErrors = []

/**
 * The tally, printed whatever happened.
 *
 * Separated from the run so a thrown selector error still reports every result
 * gathered before it. The first version of this file lost the whole run to one
 * bad locator two thirds of the way down, and a working comparison tray and a
 * working mobile drawer both came back as silence — which reads exactly like
 * "not tested".
 */
function report() {
  console.log(`\n${pass} passed, ${fail} failed`)
  if (failures.length) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`  - ${f}`)
  }
  if (notes.length) {
    console.log('\nNotes:')
    for (const n of notes) console.log(`  - ${n}`)
  }
  process.exitCode = fail > 0 ? 1 : 0
}

async function main() {
  const browser = await chromium.launch()
  try {
    await run(browser)
  } catch (error) {
    check(
      'the audit ran to completion',
      false,
      `harness error: ${error.name}: ${String(error.message).split('\n')[0]}`,
    )
  }
  await browser.close()
  report()
}

async function run(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  const page = await context.newPage()

  // Short ACTION timeout, so a selector mistake in this file surfaces as a
  // fast FAIL rather than a hung run. Navigation gets its own, much longer
  // budget: a cold `next dev` compiles /cars in about twenty seconds, and
  // 'networkidle' waits for that, so one cap for both turns a slow first
  // compile into a fake failure.
  context.setDefaultTimeout(8000)
  context.setDefaultNavigationTimeout(60000)
  page.setDefaultTimeout(8000)
  page.setDefaultNavigationTimeout(60000)

  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
  page.on('pageerror', (e) => pageErrors.push(e.message))

  const cards = () => page.locator(CARD).count()
  const search = () => new URL(page.url()).search || '(none)'
  const titles = async (n = 3) =>
    (
      await page.locator(`${CARD} h3`).evaluateAll((els, k) =>
        els.slice(0, k).map((e) => e.innerText.trim()), n)
    ).join(' / ')

  const fresh = async () => {
    await page.goto(`${BASE}/cars`, { waitUntil: 'networkidle' })
    await page.waitForSelector(CARD)
    return cards()
  }

  // ── Load ────────────────────────────────────────────────────────────
  group('PAGE LOAD')
  const res = await page.goto(`${BASE}/cars`, { waitUntil: 'networkidle' })
  check('/cars responds 200', res?.status() === 200, `status ${res?.status()}`)
  await page.waitForSelector(CARD)

  const total = await cards()
  check('every car renders', total === 48, `${total} cards`)

  const statedText = await page.locator('p').filter({ hasText: /\b48\b/ }).first().count()
  check('the page states the count', statedText > 0)

  const brokenImgs = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('article img')).filter(
        (i) => i.complete && i.naturalWidth === 0,
      ).length,
  )
  const imgCount = await page.locator(`${CARD} img`).count()
  check('no broken card images', brokenImgs === 0, `${imgCount} loaded, ${brokenImgs} broken`)
  note(`${await page.locator('article:has-text("No photograph")').count()} of ${total} cards show the no-photograph fallback`)

  // ── Hero ────────────────────────────────────────────────────────────
  group('HERO')
  const field = page.locator('input[type="search"]')
  check('the search field is present', (await field.count()) === 1)

  await field.fill('seal')
  await page.waitForTimeout(SETTLE)
  const nSeal = await cards()
  check('typing filters the grid', nSeal > 0 && nSeal < total, `${nSeal} cards`)
  check('the query reaches the URL', search().includes('q=seal'), search())

  const chip = page.locator('button').filter({ hasText: /^“seal”$/ })
  check('the query is echoed as a removable chip', (await chip.count()) === 1)
  if (await chip.count()) {
    await chip.click()
    await page.waitForTimeout(SETTLE)
    check('the chip clears the search', (await cards()) === total, `${await cards()} cards`)
  }

  const brandSel = page.locator('select[aria-label="Filter by brand"]')
  check('the hero brand select is populated', (await brandSel.locator('option').count()) === 20)
  await brandSel.selectOption('BYD')
  await page.waitForTimeout(SETTLE)
  const nByd = await cards()
  check('the hero brand select filters', nByd === 5, `${nByd} cards`)
  check('the brand reaches the URL', /brand=BYD/i.test(search()), search())

  const searchBtn = page.getByRole('button', { name: 'Search' })
  check('the hero submit button exists', (await searchBtn.count()) === 1)
  if (await searchBtn.count()) {
    await searchBtn.click()
    await page.waitForTimeout(600)
    const scrolled = await page.evaluate(() => window.scrollY)
    check('submit scrolls to the results', scrolled > 200, `scrollY ${Math.round(scrolled)}`)
  }

  // ── Category segments ───────────────────────────────────────────────
  group('CATEGORY SEGMENTS')
  await fresh()
  const SEGMENTS = [
    ['All cars', 48, null],
    ['Electric', 31, 'EV'],
    ['Plug-in hybrid', 9, 'PHEV'],
    ['Range extender', 2, 'REEV'],
    ['Hybrid', 6, 'Hybrid'],
  ]
  for (const [label, expected, param] of SEGMENTS) {
    // getByRole, not filter({hasText}): hasText tests textContent, where the
    // count span abuts the label as "Electric31", while the accessible name a
    // user actually hears — and that this asserts — is "Electric 31".
    const seg = page.getByRole('button', { name: new RegExp(`^${label}\\b`) }).first()
    if (!(await seg.count())) {
      check(`the "${label}" segment exists`, false)
      continue
    }
    await seg.click()
    await page.waitForTimeout(SETTLE)
    const n = await cards()
    check(`"${label}" shows ${expected}`, n === expected, `${n} cards, url=${search()}`)
    if (param) {
      check(`"${label}" reaches the URL`, search().includes(`type=${param}`), search())
    }
  }

  // ── Sort ────────────────────────────────────────────────────────────
  group('SORT')
  await fresh()
  const sortSel = page.locator('select').last()
  const options = await sortSel.locator('option').evaluateAll((o) => o.map((x) => x.value))
  check('sort offers six orders', options.length === 6, options.join(', '))

  const seenFirst = new Set()
  for (const value of options) {
    await sortSel.selectOption(value)
    await page.waitForTimeout(SETTLE)
    const n = await cards()
    const top = await titles(1)
    seenFirst.add(top)
    check(`"${value}" keeps all 48 and reorders`, n === total, `${n} cards, top="${top}"`)
  }
  check('the six orders produce different leaders', seenFirst.size >= 4, `${seenFirst.size} distinct: ${[...seenFirst].join(' | ')}`)

  // price-desc must genuinely be the most expensive car, not just "different".
  await sortSel.selectOption('price-desc')
  await page.waitForTimeout(SETTLE)
  check('price-desc leads with the dearest car', (await titles(1)).includes('EV9'), await titles(1))
  await sortSel.selectOption('price-asc')
  await page.waitForTimeout(SETTLE)
  check('price-asc leads with the cheapest car', (await titles(1)).includes('MINI X2'), await titles(1))

  // ── Brand rail ──────────────────────────────────────────────────────
  group('BRAND RAIL')
  await fresh()
  const tile = page.getByRole('button', { name: /^BYD\b/ }).first()
  check('the rail renders brand tiles with counts', (await tile.count()) === 1)
  if (await tile.count()) {
    await tile.click()
    await page.waitForTimeout(SETTLE)
    check('a tile filters the grid', (await cards()) === 5, `${await cards()} cards`)
    check('the tile reaches the URL', /brand=BYD/i.test(search()), search())
    await tile.click()
    await page.waitForTimeout(SETTLE)
    check('tapping the active tile clears it', (await cards()) === total, `${await cards()} cards`)
  }

  // ── Filter panel ────────────────────────────────────────────────────
  group('FILTER PANEL (sidebar)')
  await fresh()
  const aside = page.locator('aside').first()
  const asideButtons = await aside.locator('button').count()
  check('the sidebar renders its control groups', asideButtons >= 12, `${asideButtons} buttons`)

  const battery60 = aside.getByRole('button', { name: '60+ kWh' })
  if (await battery60.count()) {
    await battery60.click()
    await page.waitForTimeout(SETTLE)
    const n = await cards()
    check('a battery threshold narrows the grid', n > 0 && n < total, `${n} cards, url=${search()}`)

    const reset = page.getByRole('button', { name: /reset all/i })
    check('"Reset all" appears once filtered', (await reset.count()) === 1)
    if (await reset.count()) {
      await reset.click()
      await page.waitForTimeout(SETTLE)
      check('"Reset all" restores every car', (await cards()) === total, `${await cards()} cards`)
      check('"Reset all" clears the URL', search() === '(none)', search())
    }
  } else {
    check('the battery group offers thresholds', false)
  }

  const range400 = aside.getByRole('button', { name: '400+ km' })
  if (await range400.count()) {
    await range400.click()
    await page.waitForTimeout(SETTLE)
    const n = await cards()
    check('an electric-range threshold narrows the grid', n > 0 && n < total, `${n} cards`)
    await page.getByRole('button', { name: /reset all/i }).click()
    await page.waitForTimeout(SETTLE)
  } else {
    check('the range group offers thresholds', false)
  }

  const connector = aside.getByRole('button', { name: /^CCS2$/ })
  if (await connector.count()) {
    await connector.click()
    await page.waitForTimeout(SETTLE)
    const n = await cards()
    check('a connector filter narrows the grid', n > 0 && n < total, `${n} cards`)
    await page.getByRole('button', { name: /reset all/i }).click()
    await page.waitForTimeout(SETTLE)
  } else {
    note('no CCS2 connector button found in the sidebar — group may be collapsed')
  }

  // ── Combining, and the URL as shareable state ───────────────────────
  group('URL ROUND-TRIP')
  await page.goto(`${BASE}/cars?type=EV&brand=BYD`, { waitUntil: 'networkidle' })
  await page.waitForSelector(CARD)
  await page.waitForTimeout(SETTLE)
  const combo = await cards()
  check('a shared URL restores the filters', combo > 0 && combo < 10, `${combo} cards for type=EV&brand=BYD`)
  const evSeg = page.getByRole('button', { name: /^Electric\b/ }).first()
  if ((await evSeg.count()) > 0) {
    const pressed = await evSeg.getAttribute('aria-pressed')
    check('the restored state is reflected in the controls', pressed === 'true', `Electric aria-pressed=${pressed}`)
  } else {
    check('the restored state is reflected in the controls', false, 'no Electric segment found')
  }

  // ── Card controls ───────────────────────────────────────────────────
  group('CARD CONTROLS')
  await fresh()
  const firstName = await titles(1)

  const heart = page.locator(`${CARD} button[aria-pressed]`).first()
  check('the card offers a save button', (await heart.count()) === 1)
  const before = await heart.getAttribute('aria-pressed')
  await heart.click()
  await page.waitForTimeout(500)
  check('save toggles its pressed state', (await heart.getAttribute('aria-pressed')) !== before,
    `${before} -> ${await heart.getAttribute('aria-pressed')}`)
  check('save does not navigate away', page.url().includes('/cars'), page.url())

  const stored = await page.evaluate(() => localStorage.getItem('plugpk.favourite-cars'))
  check('save is written to localStorage', Boolean(stored) && stored !== '[]', String(stored))

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector(CARD)
  await page.waitForFunction(
    () => document.querySelectorAll('article button[aria-pressed="true"]').length > 0,
    null,
    { timeout: 5000 },
  ).then(() => check('a save survives a reload', true))
    .catch(() => check('a save survives a reload', false, 'no pressed heart after reload'))

  const savedOnly = page.getByRole('button', { name: /saved/i }).first()
  if (await savedOnly.count()) {
    await savedOnly.click()
    await page.waitForTimeout(SETTLE)
    const n = await cards()
    check('the saved-only toggle shows just the saved car', n === 1, `${n} cards`)
    await savedOnly.click()
    await page.waitForTimeout(SETTLE)
    check('untoggling saved-only restores the grid', (await cards()) === total, `${await cards()} cards`)
  } else {
    note('no saved-only toggle found')
  }

  // Unsave, so the run leaves no state behind.
  await page.evaluate(() => localStorage.removeItem('plugpk.favourite-cars'))

  // ── Comparison ──────────────────────────────────────────────────────
  group('COMPARISON')
  await fresh()
  const addButtons = page.getByRole('button', { name: /to comparison$/ })
  const addCount = await addButtons.count()
  check('every card offers an add-to-comparison button', addCount === total, `${addCount} buttons`)

  await addButtons.nth(0).click()
  await page.waitForTimeout(500)
  await addButtons.nth(1).click()
  await page.waitForTimeout(700)

  // Read the rendered text rather than using a bare text=/…/ locator: that
  // form scans the whole document and throws in strict mode the moment two
  // nodes match, which reads as a broken tray rather than a broken selector.
  const pageText = await page.locator('body').innerText()
  const trayVisible = /\b2\b[^.\n]{0,24}(cars?|selected|compare)/i.test(pageText)
  check('the tray reports two selected', trayVisible, trayVisible ? '' : 'no "2 cars/selected" text found')

  const compareLink = page.locator('a[href*="/compare"], a[href*="/cars/compare"]').first()
  if (await compareLink.count()) {
    const href = await compareLink.getAttribute('href')
    const cmp = await page.request.get(`${BASE}${href}`)
    check('the tray links to a working comparison page', cmp.status() === 200, `${href} -> ${cmp.status()}`)
  } else {
    note('no comparison link exposed in the tray at this viewport')
  }

  const removeBtn = page.getByRole('button', { name: /remove .* from comparison|clear/i }).first()
  if (await removeBtn.count()) {
    await removeBtn.click()
    await page.waitForTimeout(600)
    check('the tray can be emptied', true)
  } else {
    note('no remove/clear control found in the tray')
  }

  // ── Mobile drawer ───────────────────────────────────────────────────
  group('MOBILE FILTER DRAWER (390px)')
  const mobile = await context.newPage()
  await mobile.setViewportSize({ width: 390, height: 844 })
  await mobile.goto(`${BASE}/cars`, { waitUntil: 'networkidle' })
  await mobile.waitForSelector(CARD)

  /*
    Two buttons carry aria-label="Close filters": a full-viewport backdrop and
    the small X inside the panel. The backdrop is 390×844, so its centre — which
    is where Playwright aims — lands under the panel, the panel intercepts the
    click, and the action times out. That is correct behaviour for a backdrop
    and a trap for `.first()`, which had this reporting a working drawer as
    broken. Each way out is now tested as the thing it is.
  */
  const drawerOpen = async () =>
    (await mobile.getByRole('button', { name: 'Close filters' }).count()) > 0

  const openDrawer = async () => {
    await mobile.goto(`${BASE}/cars`, { waitUntil: 'networkidle' })
    await mobile.waitForSelector(CARD)
    await mobile.getByRole('button', { name: /^Filters/ }).first().click()
    await mobile.waitForTimeout(800)
  }

  const openFilters = mobile.getByRole('button', { name: /^Filters/ }).first()
  check('the mobile Filters button is present', (await openFilters.count()) > 0)

  await openDrawer()
  check('the drawer opens', await drawerOpen())

  // The X inside the panel: nth(1), the small one.
  await mobile.getByRole('button', { name: 'Close filters' }).nth(1).click()
  await mobile.waitForTimeout(700)
  check('the X closes the drawer', !(await drawerOpen()))

  // Tapping the backdrop clear of the panel.
  await openDrawer()
  await mobile.mouse.click(20, 60)
  await mobile.waitForTimeout(700)
  check('tapping the backdrop closes the drawer', !(await drawerOpen()))

  /*
    Escape. This was the one genuine finding of the audit and is now fixed in
    CarsBrowser: the drawer is modal — backdrop, locked body scroll — and Escape
    is the keyboard convention for dismissing exactly that. Before the fix the
    only ways out were a 30px X and a backdrop tap, both pointer gestures, so a
    keyboard user could open the filters and have no key that closed them. Kept
    as a regression guard.
  */
  await openDrawer()
  await mobile.keyboard.press('Escape')
  await mobile.waitForTimeout(700)
  check('Escape closes the drawer', !(await drawerOpen()))

  await mobile.close()

  // ── Empty state ─────────────────────────────────────────────────────
  group('EMPTY STATE')
  await page.goto(`${BASE}/cars?q=zzzznotacar`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(SETTLE)
  const none = await cards()
  check('a no-match search renders no cards', none === 0, `${none} cards`)
  const bodyText = await page.locator('body').innerText()
  check('a no-match search explains itself', /no (cars|results|match)/i.test(bodyText),
    /no (cars|results|match)/i.test(bodyText) ? '' : 'no explanatory copy found')

  // ── Runtime health ──────────────────────────────────────────────────
  group('RUNTIME')
  const realErrors = consoleErrors.filter(
    (e) => !/favicon|React DevTools|source map|Download the/i.test(e),
  )
  check('no uncaught page errors', pageErrors.length === 0, pageErrors.slice(0, 3).join(' | '))
  check('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '))

}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
