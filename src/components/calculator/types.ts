// src/components/calculator/types.ts

/**
 * One car, trimmed to what the charging calculator needs.
 *
 * Built on the server from the catalogue and sent to the client, so the page
 * ships five numbers a car rather than the full spec sheet. Every figure is the
 * catalogue's own; a limit the catalogue does not have is null, never a
 * stand-in, and the calculator says so when it has to assume.
 */
export interface CalculatorCar {
  slug: string
  name: string
  brand: string
  /** EV, PHEV or REEV. Full hybrids have no plug and are never listed. */
  category: string
  batteryKwh: number
  /** The onboard charger's ceiling, in kW. */
  acKw: number | null
  /** Peak DC rate, in kW. */
  dcKw: number | null
  /** The maker's quoted 10–80% DC time, when one is published. */
  dcQuotedMin: number | null
  /**
   * The maker's rated range on a full battery, in km: the whole range for an
   * EV, the electric-only range for a plug-in hybrid. Rated, not real-world.
   */
  rangeKm: number | null
  /** The test cycle that range was measured on (WLTP, NEDC, CLTC…), if known. */
  rangeCycle: string | null
}
