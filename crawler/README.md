# Crawler

Browser automation for gathering EV data. Lives apart from the application on
purpose: nothing in `src/` imports from here, and nothing here imports from
`src/`, so the crawler can be run, changed or thrown away without the site
noticing.

## Status — step 1 of a staged build

| | |
| --- | --- |
| ✅ Playwright drives a real browser in this project | `smoke.ts` |
| ⬜ Fetch a real page and extract fields | not started |
| ⬜ Normalise into the `Car` shape | not started |
| ⬜ Write to the database | not started |

Deliberately absent so far: no scraping of any real site, no Prisma, no schema
change, no import of application code.

## Running it

```bash
npm run crawl:smoke                          # against example.com
npm run crawl:smoke -- https://example.org   # against any other URL
```

It checks five things and exits non-zero if any fail, so it works in a `&&`
chain or CI without anyone reading the output:

1. Chromium launches
2. The page opens with a 2xx/3xx status
3. The title is readable
4. The DOM is queryable — an `h1` has text
5. The browser closes

Step 4 matters more than it looks. `page.title()` can succeed against a page
that never rendered, because the title is available straight from the markup;
querying an element is what proves a DOM was actually built, which is the only
reason to use a browser here instead of `fetch()`.

## Why `example.com`

IANA reserves it for documentation and testing, so pointing a browser at it
raises no terms-of-service or rate-limit question. It is also small and unusually
stable — which is what a smoke test needs, so that a failure here means the
problem is local rather than remote.

## Conventions this follows

**TypeScript run through `tsx`**, with no build step, matching `db:seed` and
`import:stations` in `package.json`.

**Type-checked with everything else.** The root `tsconfig.json` includes
`**/*.ts`, so files here are covered by `npm run type-check` and by
`next build`. Nothing extra was configured to achieve that, and nothing was
excluded to avoid it.

**Never leaves a browser running.** `smoke.ts` closes the browser in a `finally`,
whichever step throws. Headless chromium leaves nothing on screen to say it is
still there, so a leak is invisible until the machine is out of memory — worth
getting right in the first file rather than the tenth.

**Says who it is.** Requests carry a `PlugPK-crawler/0.1` user agent with a
contact address. When the crawler starts touching real sites, that string is the
first thing an operator will look at when deciding whether to block it.
