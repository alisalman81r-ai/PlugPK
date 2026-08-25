// crawler/priority-config.ts

/**
 * Which kind of source wins which field. The single place this is configured.
 *
 * ── Why classes of source rather than named sources ───────────────────
 *
 * Priorities are expressed over *roles* — manufacturer, Pakistan distributor,
 * EV technical database, general aggregator — and each adapter declares which
 * role it plays. Naming individual sources here would mean editing this file
 * every time one is added, and would let a source inherit authority from its
 * name rather than from what it actually is.
 *
 * ── Why there is no single global ranking ─────────────────────────────
 *
 * There is no such thing as a best source. A manufacturer's press pack is
 * definitive on battery chemistry and silent on what a Karachi dealer charges. A
 * Pakistani marketplace is the reverse. A global EV database sits between them:
 * excellent on standardised engineering figures, no opinion on local
 * availability at all.
 *
 * Rank a source as a whole and you get one of two failures — the specialist's
 * silence beating the local source's real price, or the local source's guess at a
 * battery chemistry beating a measurement.
 *
 * ── Zero means excluded, not last ─────────────────────────────────────
 *
 * A role with 0 on a field is dropped from that field's contest entirely. It is
 * how the config says "this kind of source has no business having an opinion
 * here", which is different from "believe it least".
 */

/** What a source is, which is what decides what it is trusted about. */
export type SourceRole =
  /** The maker's own published specification. */
  | 'manufacturer'
  /** The official importer or assembler for Pakistan. */
  | 'pk-distributor'
  /** A Pakistani marketplace, price aggregator or motoring outlet. */
  | 'pk-market'
  /** A specialist EV specification database. */
  | 'ev-database'
  /** A general vehicle database or aggregator. */
  | 'aggregator'
  /** An open dataset maintained by volunteers. */
  | 'open-dataset'
  /** Entered by an operator. Highest, because a person checked it. */
  | 'manual'

/**
 * Trust per role per field group, 0–100.
 *
 * Grouped rather than listed field by field, because the reasoning is the same
 * across a group: whoever is authoritative about battery capacity is
 * authoritative about its chemistry and voltage too.
 */
export interface FieldGroupTrust {
  /** Identity: brand, model, variant, trim, year, generation, bodyType. */
  identity: number
  /** Battery: capacity, usable capacity, chemistry, voltage, architecture. */
  battery: number
  /** Range, and which cycle produced it. */
  range: number
  /** AC/DC rates, onboard charger, connectors, charge times. */
  charging: number
  /** Power, torque, acceleration, top speed, drivetrain. */
  performance: number
  /** Weight, dimensions, wheelbase, boot, seats. */
  body: number
  /** Pakistani price, in rupees. */
  price: number
  /** Pakistani availability, distributor, warranty. */
  pakistan: number
  /** Photographs and their licences. */
  media: number
}

/**
 * The table. Edit this to change what wins.
 *
 * Read a row as "how much this kind of source is believed about that group".
 */
export const ROLE_TRUST: Record<SourceRole, FieldGroupTrust> = {
  /*
    A person who checked. Above every automated source by design: the whole
    pipeline exists to get a human to look, so their conclusion must not be
    outvoted by the sources they were reviewing.
  */
  manual: {
    identity: 100, battery: 100, range: 100, charging: 100,
    performance: 100, body: 100, price: 100, pakistan: 100, media: 100,
  },

  /*
    Definitive on what the car is and what it can do. Deliberately weak on the
    Pakistani price: a global press release quotes a home-market figure, and duty,
    freight and local assembly make that irrelevant here.
  */
  manufacturer: {
    identity: 98, battery: 96, range: 92, charging: 96,
    performance: 96, body: 96, price: 30, pakistan: 40, media: 90,
  },

  /*
    The official importer. The only source that actually knows the local price,
    the warranty and whether the car is even sold here — and a poor authority on
    engineering figures, which it copies from the maker and sometimes garbles.
  */
  'pk-distributor': {
    identity: 85, battery: 60, range: 55, charging: 60,
    performance: 60, body: 60, price: 98, pakistan: 98, media: 70,
  },

  /*
    Pakistani marketplaces and motoring press. Closest to the street price, which
    is often what a buyer actually pays rather than the list figure — but prone to
    repeating each other's mistakes on specifications.
  */
  'pk-market': {
    identity: 70, battery: 45, range: 45, charging: 45,
    performance: 50, body: 50, price: 85, pakistan: 88, media: 50,
  },

  /*
    Specialist EV databases. The best non-manufacturer authority on standardised
    engineering figures, and zero on anything Pakistani — they hold none, and a
    null from a trusted source must never beat a real value from a weaker one.
  */
  'ev-database': {
    identity: 80, battery: 90, range: 85, charging: 90,
    performance: 82, body: 78, price: 0, pakistan: 0, media: 60,
  },

  /*
    Volunteer-maintained open data. Genuinely good on battery and charging, and
    uneven elsewhere; freshness varies by however recently somebody cared.
  */
  'open-dataset': {
    identity: 72, battery: 85, range: 65, charging: 85,
    performance: 60, body: 55, price: 0, pakistan: 0, media: 40,
  },

  /*
    General vehicle databases. Broad, shallow, and useful mainly as a second
    opinion — which is why nothing here is high enough to win a field on its own
    against any specialist.
  */
  aggregator: {
    identity: 65, battery: 55, range: 55, charging: 55,
    performance: 60, body: 60, price: 40, pakistan: 35, media: 40,
  },
}

/** Which group a `Car` field belongs to. */
export const FIELD_GROUP: Record<string, keyof FieldGroupTrust> = {
  brand: 'identity', model: 'identity', fullName: 'identity', category: 'identity',
  variant: 'identity', trim: 'identity', modelYear: 'identity', generation: 'identity',
  bodyType: 'identity',

  batteryCapacity: 'battery', usableBatteryCapacityKwh: 'battery',
  batteryChemistry: 'battery', batteryVoltage: 'battery', batteryArchitecture: 'battery',

  range: 'range', rangeMax: 'range', electricRange: 'range', electricRangeMax: 'range',
  rangeStandard: 'range', realWorldRangeKm: 'range',

  dcCharging: 'charging', acCharging: 'charging', connectors: 'charging',
  onboardChargerKw: 'charging', chargeTime10To80Min: 'charging',

  power: 'performance', torque: 'performance', acceleration: 'performance',
  topSpeed: 'performance', drivetrain: 'performance', engineCapacity: 'performance',

  seats: 'body', weightKg: 'body', wheelbaseMm: 'body', bootCapacityL: 'body',

  priceMin: 'price', priceMax: 'price', priceDisplay: 'price', pakistanPrice: 'price',

  availability: 'pakistan', officialDistributor: 'pakistan',
  warranty: 'pakistan', batteryWarranty: 'pakistan',

  image: 'media',
}

/**
 * How much a role is trusted about a field.
 *
 * An unmapped field falls back to the role's `identity` trust rather than to
 * zero. Zero would silently drop every new field the moment it is added to the
 * schema and before it is added to the table above — a failure that looks like
 * "no source has this" rather than "the config is out of date".
 */
export function trustFor(role: SourceRole, field: string): number {
  const group = FIELD_GROUP[field] ?? 'identity'
  return ROLE_TRUST[role][group]
}

/** Ordered best-first, for showing an operator who ought to win a field. */
export function rolesByTrust(field: string): { role: SourceRole; trust: number }[] {
  return (Object.keys(ROLE_TRUST) as SourceRole[])
    .map((role) => ({ role, trust: trustFor(role, field) }))
    .filter((entry) => entry.trust > 0)
    .sort((a, b) => b.trust - a.trust)
}
