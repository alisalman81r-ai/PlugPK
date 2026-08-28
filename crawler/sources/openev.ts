// crawler/sources/openev.ts

import { emptyVehicle, type NormalisedVehicle } from '../model'
import type { AccessVerdict, FetchOptions, FetchOutcome, SourceAdapter } from './types'

/**
 * Open EV Data — github.com/KilowattApp/open-ev-data
 *
 * A published JSON dataset of electric vehicle specifications, ~1,300 records.
 * This is the one source of the four that is genuinely and verifiably usable, so
 * it is the one that is actually wired up.
 *
 * ── Licence, read rather than assumed ─────────────────────────────────
 *
 * "MIT License with Attribution Requirement", Copyright (c) 2024 Tijs Teulings.
 * It permits use, modification and commercial distribution. Clause 2 requires
 * visible attribution to "Open EV Data (https://github.com/KilowattApp/open-ev-data)"
 * somewhere credits are normally shown — an about page, documentation, or a
 * README.
 *
 * That obligation is a product task, not a crawler one, and it is not satisfied
 * yet. `access()` returns the exact attribution string so it can be surfaced at
 * review time, and it must appear on the site before any of this data is
 * published. Flagged in the Phase 2 report.
 *
 * ── Why the dataset and not the website ───────────────────────────────
 *
 * It is one HTTP request for the whole set, versioned, diffable, and needs no
 * browser. Scraping a rendered page to obtain data the maintainer publishes as
 * JSON would be slower, more fragile, and ruder.
 *
 * Fetched through api.github.com rather than raw.githubusercontent.com because
 * the raw host does not resolve from this environment; the API's raw media type
 * returns the same bytes.
 */

const DATASET_URL =
  'https://api.github.com/repos/KilowattApp/open-ev-data/contents/data/ev-data.json'

const ATTRIBUTION = 'Open EV Data (https://github.com/KilowattApp/open-ev-data)'

/** The shape the dataset actually publishes, as observed. */
interface OpenEvRecord {
  id?: string
  brand?: string
  model?: string
  variant?: string
  vehicle_type?: string
  release_year?: number
  battery_size?: number
  usable_battery_size?: number
  nominal_battery_size?: number
  battery_type?: string
  charging_voltage?: number
  range?: number
  consumption?: number
  energy_consumption?: { average_consumption?: number }
  ac_charger?: { ports?: string[]; usable_phases?: number; max_power?: number }
  dc_charger?: { ports?: string[]; max_power?: number } | null
  url?: string
  updated_at?: string
}

/** Dataset port names to the catalogue's connector spellings. */
const PORTS: Record<string, string> = {
  type1: 'Type 1',
  type2: 'Type 2',
  ccs: 'CCS2',
  ccs2: 'CCS2',
  chademo: 'CHAdeMO',
  gbt: 'GB/T',
  tesla_suc: 'Tesla',
}

function mapPort(port: string | undefined): string | null {
  if (!port) return null
  return PORTS[port.toLowerCase().replace(/[^a-z0-9]/g, '')] ?? port
}

/** A last-resort key for a record with no id, from what identifies it. */
function nameSlug(record: OpenEvRecord): string {
  return [record.brand, record.model, record.variant, record.release_year]
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown'
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

/**
 * Maps one dataset record into the internal shape.
 *
 * Exported so it can be exercised over a fixture without a network call, which
 * is the only honest way to test a mapping.
 */
export function mapOpenEvRecord(record: OpenEvRecord): NormalisedVehicle {
  /*
    The synthetic per-record URL matters more than it looks.

    Staging rows are keyed on (sourceId, sourceUrl, runId). This dataset does not
    publish a URL per vehicle, so falling back to the repository URL gave all
    1,321 records the same key — a five-record test stored one row and the runner
    cheerfully reported "stored 5". Records were being silently overwritten by
    each other.

    A dataset is not a website, so the identifier has to come from the record. The
    fragment is not a real address; it is a stable, unique key that also happens
    to say where the data came from.
  */
  const recordId = str(record.id)
  const sourceUrl = str(record.url) ??
    `https://github.com/KilowattApp/open-ev-data#${recordId ?? nameSlug(record)}`

  const vehicle = emptyVehicle({
    source: 'openev',
    sourceUrl,
    externalId: recordId,
    extractionMethod: 'dataset',
  })

  vehicle.brand = str(record.brand)
  vehicle.model = str(record.model)
  /*
    `variant` is a trim string, not a body style.

    The first version of this mapping sent it to `bodyType` on the strength of
    the few records that read "hatchback" or "SUV". Reading the stored output
    showed what it usually holds: "U 71.8 kWh Comfort" — a trim, a battery size
    and a grade. Left in bodyType that would have populated a body-style column
    with battery capacities, and any future filter on body type would have been
    quietly nonsense.
  */
  vehicle.variant = str(record.variant)
  vehicle.trim = str(record.variant)
  vehicle.modelYear = num(record.release_year)

  // Every record in this dataset is a battery electric vehicle.
  vehicle.powertrainType = 'EV'
  vehicle.fuelType = 'Electric'

  vehicle.batteryCapacityKwh = num(record.battery_size) ?? num(record.nominal_battery_size)
  vehicle.usableBatteryCapacityKwh = num(record.usable_battery_size)
  vehicle.batteryChemistry = str(record.battery_type)
  vehicle.batteryVoltage = num(record.charging_voltage)
  const volts = num(record.charging_voltage)
  vehicle.batteryArchitecture = volts === null ? null : volts >= 700 ? '800V' : '400V'

  vehicle.rangeKm = num(record.range)
  /*
    Marked unspecified, not WLTP.

    The dataset does not state which cycle its range figure comes from, and
    labelling it WLTP because most European figures are would be inventing
    provenance — the one thing that makes two sources' ranges comparable.
  */
  vehicle.rangeStandard = vehicle.rangeKm === null ? null : 'unspecified'

  vehicle.acChargingKw = num(record.ac_charger?.max_power)
  vehicle.onboardChargerKw = num(record.ac_charger?.max_power)
  vehicle.dcChargingKw = num(record.dc_charger?.max_power)
  vehicle.acConnector = mapPort(record.ac_charger?.ports?.[0])
  vehicle.dcConnector = mapPort(record.dc_charger?.ports?.[0])
  vehicle.chargingStandards = [
    ...new Set(
      [...(record.ac_charger?.ports ?? []), ...(record.dc_charger?.ports ?? [])]
        .map(mapPort)
        .filter((port): port is string => port !== null),
    ),
  ]

  /*
    Nothing about Pakistan is set.

    This is a global dataset with no local pricing or availability, and inferring
    "available in Pakistan" from a car existing would be the single most
    misleading thing this adapter could do. Those fields stay null for a
    Pakistan-specific source to fill.
  */

  const { filled, total } = coverageOf(vehicle)
  vehicle.confidence = Math.round((filled / total) * 100)

  return vehicle
}

/** Local coverage helper, kept here so model.ts stays free of adapter concerns. */
function coverageOf(vehicle: NormalisedVehicle): { filled: number; total: number } {
  const considered = [
    vehicle.brand, vehicle.model, vehicle.modelYear, vehicle.powertrainType,
    vehicle.batteryCapacityKwh, vehicle.usableBatteryCapacityKwh, vehicle.rangeKm,
    vehicle.acChargingKw, vehicle.dcChargingKw, vehicle.batteryVoltage,
    vehicle.acConnector, vehicle.dcConnector,
  ]
  return { filled: considered.filter((value) => value !== null).length, total: considered.length }
}

export const openEvAdapter: SourceAdapter = {
  id: 'openev',
  name: 'Open EV Data',
  baseUrl: 'https://github.com/KilowattApp/open-ev-data',

  /*
    High trust for standardised EV engineering figures — that is what the dataset
    is for and it is maintained against manufacturer specs.

    Zero for anything Pakistani: it holds none, and a source's trust must be zero
    where it has no business having an opinion, or the priority system will let a
    null from a trusted source beat a real value from a less trusted one.
  */
  defaultTrust: 70,
  fieldTrust: {
    batteryCapacityKwh: 85,
    usableBatteryCapacityKwh: 90,
    batteryVoltage: 85,
    batteryChemistry: 80,
    acChargingKw: 85,
    dcChargingKw: 85,
    onboardChargerKw: 85,
    rangeKm: 65,
    pakistanPrice: 0,
    availability: 0,
    officialDistributor: 0,
    warranty: 0,
    batteryWarranty: 0,
  },

  async access(): Promise<AccessVerdict> {
    /*
      Reachability is checked, not assumed. The licence is known from having read
      it; what can still fail is the network, and a run that cannot fetch should
      say so before it claims to have found no cars.
    */
    try {
      const response = await fetch(DATASET_URL, {
        method: 'HEAD',
        headers: { 'User-Agent': 'PlugPK-crawler/0.1 (+https://plug.pk)' },
      })

      if (!response.ok) {
        return {
          kind: 'blocked',
          allowed: false,
          reason: `dataset unreachable: HTTP ${response.status}`,
          requires: ['network access to api.github.com'],
        }
      }
    } catch (error) {
      return {
        kind: 'blocked',
        allowed: false,
        reason: `dataset unreachable: ${error instanceof Error ? error.message : String(error)}`,
        requires: ['network access to api.github.com'],
      }
    }

    return {
      kind: 'open-dataset',
      allowed: true,
      reason:
        'Published JSON dataset under MIT with an attribution requirement. No scraping, no credentials, one request for the whole set.',
      licence: 'MIT License with Attribution Requirement (c) 2024 Tijs Teulings',
      attribution: ATTRIBUTION,
    }
  },

  async fetch(options: FetchOptions = {}): Promise<FetchOutcome> {
    /*
      A conditional request, when we have something to condition on.

      This dataset is one file for all ~1,300 records, so there is no cursor and
      no `modifiedSince` to send — the only incremental mechanism the source
      offers is an ETag. Sending it turns the overwhelmingly common outcome of a
      daily run, "the maintainer has not committed anything since yesterday",
      from a 400KB download and 1,300 hash comparisons into one 304 and no work
      at all.

      This is politeness as much as efficiency. Pulling a whole dataset every
      morning to discover it is unchanged is exactly the traffic an ETag exists
      to prevent, and api.github.com does not count a 304 against the rate limit.
    */
    const headers: Record<string, string> = {
      'User-Agent': 'PlugPK-crawler/0.1 (+https://plug.pk)',
      Accept: 'application/vnd.github.raw+json',
    }
    if (options.etag) headers['If-None-Match'] = options.etag
    if (options.lastModified) headers['If-Modified-Since'] = options.lastModified

    const response = await fetch(DATASET_URL, { headers })

    /*
      304 is a success with no body.

      Reported as an outcome rather than an empty array, because an empty array
      would be indistinguishable from a dataset that suddenly holds no cars — and
      the pipeline treats those two facts very differently. One means "today is
      quiet"; the other would mean every car in the catalogue has lost its
      source.
    */
    if (response.status === 304) {
      return {
        vehicles: [],
        notModified: true,
        etag: options.etag ?? null,
        lastModified: options.lastModified ?? null,
      }
    }

    if (!response.ok) throw new Error(`Open EV Data returned HTTP ${response.status}`)

    const etag = response.headers.get('etag')
    const lastModified = response.headers.get('last-modified')

    const payload = (await response.json()) as { data?: OpenEvRecord[] } | OpenEvRecord[]
    const records = Array.isArray(payload) ? payload : (payload.data ?? [])

    let selected = records

    /*
      `only` matches on brand and model together, so "byd atto 3" cannot be
      satisfied by a Kia. Substring rather than exact, because the dataset's model
      strings carry suffixes this project's names do not.
    */
    if (options.only && options.only.length > 0) {
      const needles = options.only.map((entry) => entry.toLowerCase().trim())
      selected = selected.filter((record) => {
        const haystack = `${record.brand ?? ''} ${record.model ?? ''}`.toLowerCase()
        return needles.some((needle) =>
          needle.split(/\s+/).every((word) => haystack.includes(word)),
        )
      })
    }

    /*
      Ordered before the limit is applied, so a capped run takes the records the
      source itself says have changed most recently rather than whichever
      happened to be first in the file. Without this, `--limit 20` would visit
      the same twenty cars every morning and never reach the rest.

      Records with no timestamp sort last: unknown is not recent.
    */
    selected = [...selected].sort((a, b) => {
      const left = Date.parse(a.updated_at ?? '') || 0
      const right = Date.parse(b.updated_at ?? '') || 0
      return right - left
    })

    const newest = selected.reduce<Date | null>((latest, record) => {
      const stamp = Date.parse(record.updated_at ?? '')
      if (!Number.isFinite(stamp)) return latest
      const candidate = new Date(stamp)
      return latest === null || candidate > latest ? candidate : latest
    }, null)

    const totalAvailable = selected.length
    if (typeof options.limit === 'number') selected = selected.slice(0, options.limit)

    return {
      vehicles: selected.map(mapOpenEvRecord),
      notModified: false,
      etag,
      lastModified,
      newestModified: newest,
      totalAvailable,
    }
  },
}
