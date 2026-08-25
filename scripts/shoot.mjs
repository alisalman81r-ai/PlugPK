// scripts/shoot.mjs
//
// Screenshots pages from the running dev server, so a UI change can be looked
// at rather than inferred from markup.
//
// Usage:
//   node scripts/shoot.mjs /login /signup
//   node scripts/shoot.mjs --admin /admin/cars        (signs in first)
//   node scripts/shoot.mjs --mobile /login            (390px viewport)
//   node scripts/shoot.mjs --full /partners           (whole scrollable page)
//
// Files land in .screenshots/, which is gitignored — they are output, not source.
//
// The admin flag mints the portal's session cookie directly rather than driving
// the login form: the form is a server action, and reproducing its POST here
// would couple this script to an action id that changes on every build. The
// cookie is the same HMAC the server verifies, read from .env.

import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))

/**
 * Route paths, however the shell mangled them.
 *
 * Git Bash on Windows rewrites a leading-slash argument into a Windows path, so
 * `/login` arrives as `C:/Program Files/Git/login` and the URL comes out
 * nonsense. Rather than requiring every caller to remember MSYS_NO_PATHCONV,
 * this strips any such prefix and accepts `login` and `/login` alike.
 */
const paths = args
  .filter((a) => !a.startsWith('--'))
  .map((a) => a.replace(/^[A-Za-z]:[\\/].*?[\\/]Git[\\/]/, '/'))
  .map((a) => a.replace(/\\/g, '/'))
  .map((a) => (a.startsWith('/') ? a : `/${a}`))
const BASE = process.env.SHOOT_BASE ?? 'http://localhost:3000'
const OUT = '.screenshots'

if (paths.length === 0) {
  console.error('usage: node scripts/shoot.mjs [--admin] [--mobile] [--full] /path [/path…]')
  process.exit(1)
}

/** ADMIN_PASSWORD from .env, quotes stripped the way dotenv does it. */
function env(name) {
  for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
    if (match && match[1] === name) return match[2].trim().replace(/^["']|["']$/g, '')
  }
  return undefined
}

function adminCookie() {
  const secret = env('ADMIN_PASSWORD')
  if (!secret) throw new Error('ADMIN_PASSWORD is not set in .env')
  const expiresAt = Date.now() + 8 * 3600 * 1000
  const signature = crypto.createHmac('sha256', secret).update(String(expiresAt)).digest('hex')
  return {
    name: 'plugpk_admin',
    value: `${expiresAt}.${signature}`,
    domain: 'localhost',
    path: '/',
  }
}

fs.mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: flags.has('--mobile') ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

if (flags.has('--admin')) await context.addCookies([adminCookie()])

const page = await context.newPage()

for (const target of paths) {
  const url = `${BASE}${target}`
  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 })

  // Animations that start on mount would otherwise be caught mid-flight, and a
  // card at 40% opacity looks like a rendering fault rather than a fade.
  await page.addStyleTag({
    content: '*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important}',
  })
  await page.waitForTimeout(350)

  const name =
    (target === '/' ? 'home' : target.replace(/^\//, '').replace(/[^\w-]+/g, '-')) +
    (flags.has('--mobile') ? '-mobile' : '') +
    '.png'
  const file = path.join(OUT, name)
  await page.screenshot({ path: file, fullPage: flags.has('--full') })

  console.log(`${String(response?.status() ?? '???').padEnd(4)} ${target.padEnd(28)} ${file}`)
}

await browser.close()
