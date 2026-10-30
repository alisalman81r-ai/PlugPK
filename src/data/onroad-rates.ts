// src/data/onroad-rates.ts
//
// Registration and tax rates for the on-road price, FY 2026-27.
//
// ── The rule ────────────────────────────────────────────────────────────
//
// Every figure carries the source it was read from, and nothing is filled in
// by analogy. Where a province's rule cannot be pinned down for a kind of car,
// its estimate returns null and the province is simply not offered for that
// car: today that means no KP or Balochistan estimate for an EV (neither
// publishes how an EV's motor maps onto its engine-size bands) and no Sindh
// estimate for a car with an engine (its percentage registration rates could
// not be confirmed from the department itself).
//
// A car whose price is indicative or estimated gets no on-road figure at all:
// taxes worked out from a price nobody quoted would look exact and not be.
//
// ── What is and is not added ───────────────────────────────────────────
//
// The ex-factory price already includes GST, customs duty, FED and the NEV
// levy, so none of those are added again. Freight and insurance are dealer and
// market prices, not government fees, and are left out (said on the total).

import type { Car } from '@/data/cars'
import type { OnRoadEstimate, OnRoadLine, Province, TaxStatus } from '@/lib/onroad'

export interface ProvinceRates {
  estimate: (car: Car, status: TaxStatus) => OnRoadEstimate | null
}

export const RATES_FISCAL_YEAR = '2026-27'
export const RATES_CHECKED = '30 Oct 2026'

// ── Sources ────────────────────────────────────────────────────────────

const SRC = {
  itoRateCard: {
    label: 'FBR withholding tax rate card, tax year 2027',
    url: 'https://download1.fbr.gov.pk/Docs/2026811148258398WithholdingTaxRatesCard2027.xlsx',
  },
  ito: {
    label: 'Income Tax Ordinance 2001 (amended to 30 Jun 2026)',
    url: 'https://download1.fbr.gov.pk/Docs/2026724177725705IncomeTaxOrdinanace2001.pdf',
  },
  punjab: { label: 'Punjab Excise & Taxation', url: 'https://excise.punjab.gov.pk/motorvehicle_tax' },
  punjabEv: {
    label: 'Punjab 99% EV tax concession, FY 2026-27',
    url: 'https://www.phoneworld.com.pk/punjab-government-announces-99-tax-exemption-for-electric-vehicles/',
  },
  ict: { label: 'Islamabad Excise & Taxation fee schedule', url: 'https://islamabadexcise.gov.pk/' },
  ictAct: {
    label: 'Finance Act 2026 (ICT motor vehicle tax)',
    url: 'https://download1.fbr.gov.pk/Docs/20266291261044366FinanceAct2026.pdf',
  },
  sindhEv: {
    label: 'Sindh EV tax incentives, Sept 2026',
    url: 'https://propakistani.pk/2026/09/01/sindh-extends-tax-incentives-on-evs/',
  },
  sindhPlate: { label: 'Sindh Ajrak number plate fee', url: 'https://arynews.tv/ajrak-number-plate-policy-challenged-in-shc/' },
  sindhCard: {
    label: 'Sindh smart card fee',
    url: 'https://www.bolnews.com/pakistan/sindh-excise-faces-hurdles-over-ajrak-themed-number-plates',
  },
  kp: { label: 'KP Excise & Taxation', url: 'https://www.kpexcise.gov.pk/new/mvtax/' },
  kpAct: {
    label: 'KP Finance Act 2025',
    url: 'https://kpcode.kp.gov.pk/uploads/THE_KHYBER_PAKHTUNKHWA_FINANCE_ACT_2025.pdf',
  },
  balochistan: {
    label: 'Balochistan Excise motor vehicle tax schedule',
    url: 'https://excise.balochistan.gov.pk/wp-content/uploads/2026/01/mvtx.pdf',
  },
  balochistanPlate: {
    label: 'Balochistan number plate notification',
    url: 'https://excise.balochistan.gov.pk/wp-content/uploads/2025/11/Notif-Revis-RateNP.pdf',
  },
}

// ── Shared helpers ────────────────────────────────────────────────────

const isElectric = (car: Car) => car.category === 'EV'

/** A price that is quoted rather than indicative or estimated. */
const isFirm = (car: Car) => !/\((?:indicative|estimated)\)/i.test(car.price.display)

/** The first band whose ceiling the figure does not exceed. */
function band<T>(value: number, bands: Array<[ceiling: number, result: T]>): T {
  for (const [ceiling, result] of bands) if (value <= ceiling) return result
  return bands[bands.length - 1]![1]
}

/**
 * Section 231B: advance income tax on a new car, collected by the seller.
 *
 * A percentage of the price by engine size. An EV has no engine size: the
 * Ordinance taxes one worth Rs 5 million or more at 3%, and sets no rate below
 * that. A non-filer pays three times the rate (Tenth Schedule, rule 1 proviso).
 */
function advanceTax(car: Car, status: TaxStatus): OnRoadLine | null {
  const value = car.price.min
  const times = status === 'nonFiler' ? 3 : 1
  if (isElectric(car)) {
    if (value < 5_000_000)
      return { label: 'Advance income tax (s.231B)', amount: 0, free: true, note: 'No rate is set for electric cars under Rs 5 million.' }
    const rate = 0.03 * times
    return {
      label: 'Advance income tax (s.231B)',
      amount: value * rate,
      note:
        status === 'filer'
          ? '3% of the price for an electric car of Rs 5 million or more.'
          : '9% of the price: three times the filer rate, which the rate card does not print but the Tenth Schedule sets.',
    }
  }
  if (!car.engineCapacity) return null
  const filerRate = band(car.engineCapacity, [
    [850, 0.005], [1000, 0.01], [1300, 0.015], [1600, 0.02], [1800, 0.03],
    [2000, 0.05], [2500, 0.07], [3000, 0.09], [Infinity, 0.12],
  ])
  const rate = filerRate * times
  return {
    label: 'Advance income tax (s.231B)',
    amount: value * rate,
    note: `${+(rate * 100).toFixed(1)}% of the price for a ${car.engineCapacity}cc engine${status === 'nonFiler' ? ', three times the filer rate' : ''}.`,
  }
}

/**
 * Section 234: the yearly income tax collected with the token tax.
 *
 * Fixed rupees by engine size, doubled for a non-filer. The Ordinance has no
 * row for an electric car, so none is charged here; the line says so rather
 * than vanishing, because some excise offices may still collect it.
 */
function motorVehicleIncomeTax(car: Car, status: TaxStatus): OnRoadLine | null {
  if (isElectric(car))
    return { label: 'Income tax (s.234)', amount: 0, free: true, note: 'The Ordinance sets no rate for electric cars. Confirm at registration.' }
  if (!car.engineCapacity) return null
  const filer = band(car.engineCapacity, [
    [1000, 800], [1199, 1500], [1299, 1750], [1499, 2500], [1599, 3750], [1999, 4500], [Infinity, 10000],
  ])
  return {
    label: 'Income tax (s.234)',
    amount: status === 'nonFiler' ? filer * 2 : filer,
    note: `Year one, ${car.engineCapacity}cc${status === 'nonFiler' ? ', double the filer rate' : ''}.`,
  }
}

/** Builds the estimate from the two sections, or null if a line is missing. */
function assemble(
  car: Car,
  status: TaxStatus,
  registration: Array<OnRoadLine | null>,
  caveat: string,
  sources: Array<{ label: string; url: string }>,
): OnRoadEstimate | null {
  if (!isFirm(car)) return null
  const advance = advanceTax(car, status)
  if (!advance || registration.some((line) => line === null)) return null
  const lines = registration as OnRoadLine[]
  const dealership = [{ label: 'Ex-factory price', amount: car.price.min }, advance]
  const sum = (items: OnRoadLine[]) => items.reduce((total, line) => total + line.amount, 0)
  const sections = [
    { title: 'Payable at the dealership', total: sum(dealership), lines: dealership },
    { title: 'Registration and first-year taxes', total: sum(lines), lines },
  ]
  return {
    sections,
    total: sections[0]!.total + sections[1]!.total,
    totalNote: 'Excl. freight and insurance',
    caveat: `${caveat} Approximate: the invoice can differ by excise office and dealer, and the ex-factory price already includes GST and duties.`,
    sources: [SRC.itoRateCard, ...sources],
  }
}

// ── Punjab ────────────────────────────────────────────────────────────

/** Punjab rates an EV by motor power: 1 kW = 18.77cc (PMVT Act s.3(4)). */
const PUNJAB_KW_TO_CC = 18.77

const punjab: ProvinceRates = {
  estimate(car, status) {
    const electric = isElectric(car)
    const cc = electric ? (car.motorPowerKw ? car.motorPowerKw * PUNJAB_KW_TO_CC : null) : car.engineCapacity
    if (!cc) return null
    const value = car.price.min
    const ccNote = electric ? `${car.motorPowerKw} kW, rated as ${Math.round(cc)}cc` : `${cc}cc`

    const regRate = band(cc, [[1000, 0.01], [2000, 0.02], [Infinity, 0.04]])
    const registration: OnRoadLine = electric
      ? {
          label: 'Registration fee',
          amount: value * regRate * 0.05,
          note: `${regRate * 100}% of the price for ${ccNote}, less Punjab's 95% EV exemption.`,
        }
      : { label: 'Registration fee', amount: value * regRate, note: `${regRate * 100}% of the price for ${ccNote}.` }

    let token: OnRoadLine
    if (cc <= 1000) {
      // The lifetime lump sum. Reports say the 99% EV concession excludes the
      // lump-sum category, so it is charged in full here.
      token = { label: 'Token tax (lifetime)', amount: 20000, note: 'One-time lifetime tax for cars up to 1000cc.' }
    } else {
      const rate = cc <= 2000 ? 0.003 : 0.004
      const floor = band(cc, [[1299, 1800], [1300, 1800], [1500, 6000], [2000, 9000], [2500, 12000], [Infinity, 15000]])
      const full = Math.max(value * rate, floor)
      token = electric
        ? { label: 'Token tax (year 1)', amount: full * 0.01, note: `${rate * 100}% of the price a year, less Punjab's 99% EV concession (to 30 Jun 2027).` }
        : { label: 'Token tax (year 1)', amount: full, note: `${rate * 100}% of the price a year.` }
    }

    return assemble(
      car,
      status,
      [
        registration,
        token,
        motorVehicleIncomeTax(car, status),
        { label: 'Smart card', amount: 1300 },
        { label: 'Professional tax', amount: 200 },
        { label: 'Number plate', amount: 0, free: true, note: 'Punjab stopped charging a plate fee in April 2024.' },
      ],
      'Punjab rates from the Excise & Taxation department and the Punjab Finance Act 2026.',
      electric ? [SRC.punjab, SRC.punjabEv] : [SRC.punjab],
    )
  },
}

// ── Islamabad ─────────────────────────────────────────────────────────

const ict: ProvinceRates = {
  estimate(car, status) {
    const electric = isElectric(car)
    const fixed: OnRoadLine[] = [
      { label: 'Smart card', amount: 2400 },
      { label: 'Number plate', amount: 1000 },
      { label: 'Professional tax', amount: 100, note: 'Added by the ICT Excise fee calculator.' },
    ]
    if (electric) {
      return assemble(
        car,
        status,
        [
          { label: 'Registration fee', amount: 0, free: true, note: 'Electric cars are exempt in Islamabad.' },
          { label: 'Token tax', amount: 0, free: true, note: 'Electric cars are exempt in Islamabad.' },
          motorVehicleIncomeTax(car, status),
          ...fixed,
        ],
        'Islamabad rates from the ICT Excise & Taxation fee schedule.',
        [SRC.ict],
      )
    }
    const cc = car.engineCapacity
    if (!cc) return null
    const value = car.price.min
    const regRate = band(cc, [[1000, 0.01], [2000, 0.02], [Infinity, 0.04]])
    const token: OnRoadLine =
      cc <= 1000
        ? { label: 'Token tax (lifetime)', amount: 20000, note: 'One-time lifetime tax for cars up to 1000cc.' }
        : (() => {
            const rate = cc <= 2000 ? 0.0025 : 0.0035
            return { label: 'Token tax (year 1)', amount: value * rate, note: `${rate * 100}% of the price a year.` }
          })()
    return assemble(
      car,
      status,
      [
        { label: 'Registration fee', amount: value * regRate, note: `${regRate * 100}% of the price for ${cc}cc.` },
        token,
        motorVehicleIncomeTax(car, status),
        ...fixed,
      ],
      'Islamabad rates from the ICT Excise schedule and the Finance Act 2026.',
      [SRC.ict, SRC.ictAct],
    )
  },
}

// ── Sindh: electric cars only ─────────────────────────────────────────

const sindh: ProvinceRates = {
  estimate(car, status) {
    if (!isElectric(car)) return null
    // Sindh charges Rs 5,000 on EVs it rates at 2000cc or above but has not
    // published its kW conversion; Punjab's 18.77 cc/kW is used to decide the
    // band, and the note says so.
    const large = car.motorPowerKw ? car.motorPowerKw * PUNJAB_KW_TO_CC > 2000 : null
    if (large === null) return null
    return assemble(
      car,
      status,
      [
        { label: 'Registration fee', amount: 1000, note: "Sindh's flat fee for electric cars, to 29 May 2028." },
        { label: 'Motor vehicle tax (year 1)', amount: 500, note: "Sindh's flat yearly tax for electric cars." },
        ...(large
          ? [{
              label: 'Luxury tax',
              amount: 5000,
              note: 'For electric cars rated 2000cc or above. Sindh has not published how kW maps to cc; this uses the Punjab conversion.',
            }]
          : []),
        motorVehicleIncomeTax(car, status),
        { label: 'Number plate (Ajrak)', amount: 2450 },
        { label: 'Smart card', amount: 1600 },
      ],
      'Sindh EV rates from the cabinet decision of September 2026; plate and card fees from press reports.',
      [SRC.sindhEv, SRC.sindhPlate, SRC.sindhCard],
    )
  },
}

// ── Khyber Pakhtunkhwa: cars with an engine ───────────────────────────

const kp: ProvinceRates = {
  estimate(car, status) {
    if (isElectric(car) || !car.engineCapacity) return null
    const cc = car.engineCapacity
    const value = car.price.min
    const regRate = band(cc, [[1300, 0.01], [2500, 0.02], [Infinity, 0.04]])
    const token = band(cc, [[1000, 2000], [1300, 3000], [1500, 4000], [2500, 5000], [Infinity, 8000]])
    return assemble(
      car,
      status,
      [
        { label: 'Registration fee', amount: value * regRate, note: `${regRate * 100}% of the price for ${cc}cc.` },
        { label: 'Token tax (year 1)', amount: token, note: `${cc}cc, KP Finance Act 2025.` },
        motorVehicleIncomeTax(car, status),
        { label: 'Number plates (pair)', amount: 899 },
        { label: 'Registration book', amount: 208 },
        { label: 'Scanning fee', amount: 198 },
      ],
      'KP rates from the Excise & Taxation department and the KP Finance Act 2025.',
      [SRC.kp, SRC.kpAct],
    )
  },
}

// ── Balochistan: cars with an engine ──────────────────────────────────

const balochistan: ProvinceRates = {
  estimate(car, status) {
    if (isElectric(car) || !car.engineCapacity) return null
    const cc = car.engineCapacity
    const value = car.price.min
    const regRate = cc <= 1500 ? 0.01 : 0.0125
    // Above 1000cc a new car can pay yearly instead of the lifetime sum; the
    // yearly option is shown, as the smaller amount due at registration.
    const tax: OnRoadLine =
      cc <= 660
        ? { label: 'Motor vehicle tax (lifetime)', amount: 10500 }
        : cc <= 1000
          ? { label: 'Motor vehicle tax (lifetime)', amount: 12000 }
          : {
              label: 'Motor vehicle tax (year 1)',
              amount: band(cc, [[1500, 1400], [2000, 1700], [Infinity, 2000]]),
              note: `Yearly option; the lifetime sum is Rs ${band(cc, [[1500, 17000], [2000, 20000], [Infinity, 24000]]).toLocaleString('en-US')}.${car.category === 'PHEV' ? " Balochistan waives this for 'new energy vehicles' to 2030 but does not say whether plug-in hybrids qualify." : ''}`,
            }
    return assemble(
      car,
      status,
      [
        { label: 'Registration fee', amount: value * regRate, note: `${regRate * 100}% of the price for ${cc}cc.` },
        tax,
        motorVehicleIncomeTax(car, status),
        { label: 'Number plate', amount: 2100 },
        { label: 'Registration book', amount: 700 },
      ],
      'Balochistan rates from the Excise & Taxation schedule and the Balochistan Finance Act 2026.',
      [SRC.balochistan, SRC.balochistanPlate],
    )
  },
}

export const PROVINCE_RATES: Partial<Record<Province, ProvinceRates>> = {
  punjab,
  sindh,
  ict,
  kp,
  balochistan,
}

