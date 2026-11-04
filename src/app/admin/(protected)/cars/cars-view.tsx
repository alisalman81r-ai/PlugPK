// src/app/admin/(protected)/cars/cars-view.tsx
import Link from 'next/link'

import { AdminPagination } from '@/components/admin/AdminPagination'
import { CarDeleteCard } from '@/components/admin/CarDeleteCard'
import { CarForm } from '@/components/admin/CarForm'
import { CarImageManager } from '@/components/admin/CarImageManager'
import { CarInventory } from '@/components/admin/CarInventory'
import { countLenses, filterAudits, type Lens, type SortKey } from '@/components/admin/car-inventory-filter'
import type { ListParams } from '@/components/admin/list-params'
import { Ico, Kpi, Page, PageHead, k, rise, s } from '@/components/admin/people/kit'
import { ADMIN_PAGE_SIZE } from '@/lib/db/admin-queries'
import type { Car } from '@/data/cars'
import { summarise, type CarAudit } from '@/lib/car-admin'

/** The page itself, from the audited catalogue. Separate so it can be rendered without a database. */
export function CarsView({
  audits,
  params,
  query,
  lens,
  sort,
  page,
}: {
  audits: CarAudit[]
  params: ListParams
  query: string
  lens: Lens
  sort: SortKey
  page: number
}) {
  const summary = summarise(audits)
  const matching = filterAudits(audits, query, lens, sort)
  const pageRows = matching.slice((page - 1) * ADMIN_PAGE_SIZE, page * ADMIN_PAGE_SIZE)

  return (
    <Page>
      <PageHead
        title="Cars"
        help={
          <>
            <b>The EV catalogue shown on the public car pages</b> — specs, prices, photos. Completeness on each row is
            how much of a car&rsquo;s data is filled in; a car missing a battery figure or a photo still publishes, it
            just looks thin to a buyer comparing models.
          </>
        }
        description={`${summary.total} models from ${summary.brands} brands.`}
        actions={
          <>
            <Link href="/cars" target="_blank" rel="noopener noreferrer" className={k('btn', 'btn--line')}>
              <Ico n="car" />
              Live catalogue
            </Link>
            <Link href="/admin/cars/new" className={k('btn', 'btn--ink')}>
              <Ico n="plus" />
              Add car
            </Link>
          </>
        }
      />

      {/* ── The four figures worth knowing before scrolling ─────── */}
      <section className={s.kpis} aria-label="Catalogue figures">
        <Kpi
          icon="car"
          label="Models listed"
          value={summary.total}
          note={summary.byCategory.map((entry) => `${entry.count} ${entry.category}`).join(' · ')}
        />
        <Kpi
          icon="okc"
          label="Average completeness"
          value={summary.averageCompleteness}
          unit="%"
          tone="lit"
          i={1}
          note="Against the fields each powertrain is expected to carry"
        />
        <Kpi
          icon="img"
          label={summary.withoutPhoto === 1 ? 'Model with no photo' : 'Models with no photo'}
          value={summary.withoutPhoto}
          i={2}
          note={
            <>
              <i className={k('dot', summary.withoutPhoto > 0 ? 'dot--warn' : 'dot--ok')} />
              <span className={summary.withoutPhoto > 0 ? s.warnTxt : s.ok}>
                {summary.withPhoto} of {summary.total} have a photograph
              </span>
            </>
          }
        />
        <Kpi
          icon="alert"
          label="Indicative prices"
          value={summary.indicativePrices}
          tone={summary.indicativePrices > 0 ? 'warn' : 'plain'}
          i={3}
          note={`Shown with an “Indicative” label on the site · ${summary.confirmedPrices} from a supplied price list`}
        />
      </section>

      <CarInventory
        audits={pageRows}
        total={matching.length}
        counts={countLenses(audits)}
        lens={lens}
        sort={sort}
        query={query}
      />
      <AdminPagination
        path="/admin/cars"
        params={params}
        page={page}
        pageSize={ADMIN_PAGE_SIZE}
        total={matching.length}
        noun={['car', 'cars']}
      />
    </Page>
  )
}

/** Adding a car: the same form as the edit page, with no car passed. */
export function NewCarView({ brands }: { brands: string[] }) {
  return (
    <Page>
      <PageHead
        title="Add a car"
        backHref="/admin/cars"
        backLabel="Back to Cars"
        description="Goes live on the public catalogue as soon as it is saved."
        actions={
          <Link href="/admin/cars" className={k('btn', 'btn--line')}>
            <Ico n="car" />
            All cars
          </Link>
        }
      />

      <div style={{ maxWidth: 1080 }}>
        <div className={k('notice', 'notice--info')}>
          <Ico n="info" />
          <div>
            <b>Only brand, model, powertrain and price are required.</b>
            <span>
              Everything else can be filled in later, and a blank figure is stored as <b>not published</b> rather than
              guessed. Add the photograph after saving.
            </span>
          </div>
        </div>

        <CarForm brands={brands} />
      </div>
    </Page>
  )
}

/**
 * One car, editable.
 *
 * Three panels rather than one long form: the fields, the photograph, and what
 * is outstanding. They are separate because they are saved separately — the
 * photograph has its own action, so replacing an image cannot be lost by a
 * validation error twenty fields away, and a failed upload cannot take an edit
 * with it. The raw record stays at the bottom behind a disclosure.
 */
export function CarDetailView({ car, brands, audit }: { car: Car; brands: string[]; audit: CarAudit }) {
  const tone = audit.completeness === 100 ? '#35D07F' : audit.completeness >= 60 ? '#4C8DFF' : '#FFB020'
  const complete = rise(2)
  const outstanding = rise(3)
  const raw = rise(6)

  return (
    <Page>
      <PageHead
        title={car.fullName}
        backHref="/admin/cars"
        backLabel="Back to Cars"
        description={`${car.category} · ${car.price.display}`}
        actions={
          <>
            <Link href="/admin/cars" className={k('btn', 'btn--line')}>
              <Ico n="car" />
              All cars
            </Link>
            <Link href={`/cars/${car.slug}`} target="_blank" rel="noopener noreferrer" className={k('btn', 'btn--ink')}>
              <Ico n="ext" />
              Live page
            </Link>
          </>
        }
      />

      <div className={s.cols}>
        <div className={s.stack18}>
          <CarForm car={car} brands={brands} />

          <details className={k('card', 'raw', raw.className)} style={raw.style}>
            <summary>
              Raw record
              <Ico n="down" />
            </summary>
            <pre data-lenis-prevent="">
              <code>{JSON.stringify(car, null, 2)}</code>
            </pre>
          </details>
        </div>

        <aside className={s.stack18}>
          <CarImageManager carId={car.id} carName={car.fullName} image={car.image} credit={audit.credit} />

          {/* ── Completeness ─────────────────────────────────────── */}
          <section className={k('card', 'panel', complete.className)} style={complete.style}>
            <p className={s.lab}>Data completeness</p>
            <div className={s.big}>
              <b>
                {audit.completeness}%
              </b>
              <span>
                {audit.filled} of {audit.expected} expected fields
              </span>
            </div>
            <div className={s.track}>
              <i style={{ width: `${audit.completeness}%`, background: tone }} />
            </div>
            <p className={s.panel__p}>
              Measured against the fields a <b>{car.category}</b> is expected to carry. A full hybrid has no plug, so
              charging fields are not counted against one.
            </p>
          </section>

          {/* ── Outstanding ──────────────────────────────────────── */}
          <section className={k('card', 'panel', outstanding.className)} style={outstanding.style}>
            <h2>
              <Ico n="alert" />
              Outstanding
              <span className={s.cnt}>{audit.issues.length}</span>
            </h2>

            {audit.issues.length === 0 ? (
              <p>
                Nothing outstanding. Every expected figure is present, the price came from a supplied list, and the
                photograph is licensed and credited.
              </p>
            ) : (
              <ul className={s.issues}>
                {audit.issues.map((issue) => (
                  <li key={issue.label}>
                    <span
                      className={issue.level === 'warn' ? s.w : undefined}
                      role="img"
                      aria-label={issue.level === 'warn' ? 'Warning' : 'For information'}
                    >
                      <Ico n={issue.level === 'warn' ? 'alert' : 'info'} />
                    </span>
                    <div>
                      <b>{issue.label}</b>
                      <p>{issue.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <CarDeleteCard carId={car.id} carName={car.fullName} />
        </aside>
      </div>
    </Page>
  )
}
