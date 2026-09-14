// src/lib/city-coordinates.ts

/**
 * Approximate centres of Pakistani cities, so a journey between two of them
 * can be placed on the map.
 *
 * ── Why this file has to exist ────────────────────────────────────────
 *
 * The route planner had no idea where anywhere was. It chose charging stops
 * with `[...MOCK_STATIONS].sort(() => Math.random() - 0.5)`, so a run from
 * Faisalabad to Murree could be sent to charge in Lahore — 120 km off the
 * line and in the wrong direction. Nothing was wrong with the arithmetic;
 * there was no geography in it at all. Choosing stops that lie between two
 * places means first knowing where those places are.
 *
 * ── What these numbers are, and are not ───────────────────────────────
 *
 * City centres to roughly a kilometre, which is the precision corridor
 * geometry needs: a stop is kept or dropped on whether it sits within tens of
 * kilometres of the line, so a kilometre either way never changes the answer.
 *
 * They are NOT navigation data. Nothing here should be used to route a driver
 * down a road, to state a distance as fact, or to place a pin somebody is
 * expected to drive to. The planner labels its output an estimate, and this is
 * one of the reasons it has to.
 *
 * A city missing from this list is not a failure: `getCityCoordinates` returns
 * null, and the planner says it cannot place stops for that journey. That is
 * the honest answer, and better than inventing one.
 */

import type { Coordinates } from '@/lib/types'

/**
 * Keyed by lower-case name. Covers the cities the distance table already
 * knows, every city that currently holds a station, and the larger towns along
 * the motorway and national-highway corridors those journeys run on.
 */
const CITY_COORDINATES: Record<string, Coordinates> = {
  // ── The major cities ────────────────────────────────────────────────
  islamabad: { lat: 33.6844, lng: 73.0479 },
  rawalpindi: { lat: 33.5651, lng: 73.0169 },
  lahore: { lat: 31.5204, lng: 74.3587 },
  karachi: { lat: 24.8607, lng: 67.0011 },
  faisalabad: { lat: 31.4504, lng: 73.135 },
  multan: { lat: 30.1575, lng: 71.5249 },
  peshawar: { lat: 34.0151, lng: 71.5249 },
  quetta: { lat: 30.1798, lng: 66.975 },
  hyderabad: { lat: 25.396, lng: 68.3578 },
  gujranwala: { lat: 32.1877, lng: 74.1945 },
  sialkot: { lat: 32.4945, lng: 74.5229 },
  sargodha: { lat: 32.0836, lng: 72.6711 },
  bahawalpur: { lat: 29.3956, lng: 71.6836 },
  sukkur: { lat: 27.7052, lng: 68.8574 },
  larkana: { lat: 27.558, lng: 68.212 },

  // ── The northern hill towns ─────────────────────────────────────────
  murree: { lat: 33.907, lng: 73.3943 },
  abbottabad: { lat: 34.1688, lng: 73.2215 },
  mansehra: { lat: 34.33, lng: 73.2 },
  haripur: { lat: 33.9942, lng: 72.9333 },
  muzaffarabad: { lat: 34.37, lng: 73.4711 },
  mingora: { lat: 34.7795, lng: 72.3614 },
  gilgit: { lat: 35.9208, lng: 74.308 },
  skardu: { lat: 35.2971, lng: 75.6333 },
  chilas: { lat: 35.42, lng: 74.1 },
  hunza: { lat: 36.3167, lng: 74.65 },
  astore: { lat: 35.3667, lng: 74.85 },
  chitral: { lat: 35.8518, lng: 71.7864 },

  // ── Along the GT road and the M2 ────────────────────────────────────
  attock: { lat: 33.766, lng: 72.36 },
  'wah cantonment': { lat: 33.7667, lng: 72.75 },
  jhelum: { lat: 32.9333, lng: 73.7333 },
  gujrat: { lat: 32.574, lng: 74.0754 },
  chakwal: { lat: 32.9328, lng: 72.863 },
  'mandi bahauddin': { lat: 32.5861, lng: 73.4917 },
  hafizabad: { lat: 32.0709, lng: 73.688 },
  sheikhupura: { lat: 31.7131, lng: 73.9783 },
  'nankana sahib': { lat: 31.4492, lng: 73.7126 },
  kasur: { lat: 31.1187, lng: 74.45 },
  narowal: { lat: 32.1, lng: 74.87 },
  chiniot: { lat: 31.72, lng: 72.9781 },
  jhang: { lat: 31.2781, lng: 72.3317 },
  'toba tek singh': { lat: 30.9709, lng: 72.4826 },
  khushab: { lat: 32.296, lng: 72.352 },
  mianwali: { lat: 32.5839, lng: 71.537 },
  bhakkar: { lat: 31.6333, lng: 71.0667 },

  // ── South through Punjab ────────────────────────────────────────────
  okara: { lat: 30.8138, lng: 73.4534 },
  sahiwal: { lat: 30.6682, lng: 73.1114 },
  pakpattan: { lat: 30.34, lng: 73.4 },
  khanewal: { lat: 30.3017, lng: 71.9321 },
  vehari: { lat: 30.0442, lng: 72.3489 },
  lodhran: { lat: 29.54, lng: 71.63 },
  bahawalnagar: { lat: 29.9983, lng: 73.2533 },
  'rahim yar khan': { lat: 28.4202, lng: 70.2952 },
  muzaffargarh: { lat: 30.0736, lng: 71.1805 },
  layyah: { lat: 30.96, lng: 70.94 },
  'dera ghazi khan': { lat: 30.0561, lng: 70.6403 },
  rajanpur: { lat: 29.1041, lng: 70.3297 },

  // ── Khyber Pakhtunkhwa ──────────────────────────────────────────────
  nowshera: { lat: 34.0153, lng: 71.9747 },
  mardan: { lat: 34.1989, lng: 72.0231 },
  swabi: { lat: 34.12, lng: 72.47 },
  charsadda: { lat: 34.1682, lng: 71.7404 },
  kohat: { lat: 33.5869, lng: 71.4414 },
  bannu: { lat: 32.9889, lng: 70.6056 },
  'dera ismail khan': { lat: 31.8313, lng: 70.9019 },
  hangu: { lat: 33.5333, lng: 71.05 },
  karak: { lat: 33.1167, lng: 71.0833 },
  'lakki marwat': { lat: 32.607, lng: 70.911 },
  tank: { lat: 32.2167, lng: 70.3833 },
  batkhela: { lat: 34.6167, lng: 72.0 },
  timergara: { lat: 34.8281, lng: 71.8419 },

  // ── Azad Kashmir ────────────────────────────────────────────────────
  mirpur: { lat: 33.1478, lng: 73.7519 },
  kotli: { lat: 33.518, lng: 73.902 },
  rawalakot: { lat: 33.8578, lng: 73.7604 },
  bagh: { lat: 33.98, lng: 73.77 },
  bhimber: { lat: 32.974, lng: 74.079 },

  // ── Sindh ───────────────────────────────────────────────────────────
  thatta: { lat: 24.7461, lng: 67.9243 },
  badin: { lat: 24.656, lng: 68.837 },
  jamshoro: { lat: 25.43, lng: 68.28 },
  dadu: { lat: 26.73, lng: 67.78 },
  nawabshah: { lat: 26.2483, lng: 68.4096 },
  khairpur: { lat: 27.5295, lng: 68.7592 },
  shikarpur: { lat: 27.9556, lng: 68.6382 },
  jacobabad: { lat: 28.282, lng: 68.438 },
  ghotki: { lat: 28.0, lng: 69.3167 },
  sanghar: { lat: 26.046, lng: 68.949 },
  'mirpur khas': { lat: 25.5276, lng: 69.0122 },
  umerkot: { lat: 25.3614, lng: 69.7361 },
  matiari: { lat: 25.599, lng: 68.446 },
  'tando adam': { lat: 25.7667, lng: 68.6614 },
  'tando allahyar': { lat: 25.46, lng: 68.719 },
  hub: { lat: 25.0, lng: 67.1 },

  // ── Balochistan ─────────────────────────────────────────────────────
  gwadar: { lat: 25.1264, lng: 62.3225 },
  turbat: { lat: 26.0023, lng: 63.045 },
  khuzdar: { lat: 27.812, lng: 66.61 },
  kalat: { lat: 29.026, lng: 66.59 },
  mastung: { lat: 29.799, lng: 66.845 },
  sibi: { lat: 29.543, lng: 67.877 },
  zhob: { lat: 31.341, lng: 69.449 },
  loralai: { lat: 30.3705, lng: 68.598 },
  chaman: { lat: 30.92, lng: 66.45 },
  nushki: { lat: 29.55, lng: 66.02 },
  panjgur: { lat: 26.97, lng: 64.1 },
  kharan: { lat: 28.585, lng: 65.415 },
  'dera murad jamali': { lat: 28.55, lng: 68.2167 },
  'usta mohammad': { lat: 28.18, lng: 68.05 },
}

/**
 * Where a city is, or null if this list does not hold it.
 *
 * Matched on the trimmed lower-case name, which is how the planner's
 * free-text fields and the station records both spell them.
 */
export function getCityCoordinates(name: string): Coordinates | null {
  const key = name.trim().toLowerCase()
  if (!key) return null
  return CITY_COORDINATES[key] ?? null
}
