// src/data/car-features.ts
//
// Key features, per car, as the Pakistan trim is equipped.
//
// ── The rule ────────────────────────────────────────────────────────────
//
// The same rule as the catalogue: nothing here is inferred. A feature is
// listed because the manufacturer, its Pakistan distributor, or launch
// reporting quoting them says the Pakistan car has it — and every entry
// names those sources, so a reviewer can check any line. A car with no entry
// shows no Key Features section at all rather than an empty or padded one.
//
// Keyed by slug, not id, because the slug is what a reviewer reads in the
// URL. Groups render in the order of FEATURE_GROUP_ORDER, and a group with no
// items is simply left out.

export const FEATURE_GROUP_ORDER = [
  'Safety',
  'Driver Assistance (ADAS)',
  'Parking',
  'Powertrain & Charging',
  'Infotainment & Connectivity',
  'Seats & Interior',
  'Comfort & Convenience',
  'Exterior & Lighting',
] as const

export type FeatureGroup = (typeof FEATURE_GROUP_ORDER)[number]

export interface CarFeatures {
  /** Which trim the list describes, when the car is sold in more than one. */
  trim?: string
  groups: Partial<Record<FeatureGroup, string[]>>
  /** Where the list was checked. At least one. */
  sources: string[]
  /** The date the list was last checked against its sources, YYYY-MM-DD. */
  checked: string
}

// BYD, from the BYD Pakistan (Mega Motor) brochures of August 2026 and the
// Mega Motor spec flyers. The Sealion 6 is not listed: it is not on sale yet
// and BYD Pakistan has not published its trim.
export const CAR_FEATURES: Record<string, CarFeatures> = {
  'byd-atto-2': {
    trim: 'Premium',
    groups: {
      'Safety': [
        'Six airbags (front, front side, side curtain)',
        'Traction control (TCS)',
        'Electronic brake-force distribution (EBD)',
        'Electronic parking brake with auto-hold',
        'Hill descent control',
        'Brake override system',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Cell-to-Body (CTB) battery structure',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control (ACC)',
        'Intelligent cruise control (ICC)',
        'Speed adjustment on curves (SAOC)',
        'Automatic emergency braking (AEB)',
        'Front collision warning (FCW)',
        'Lane departure warning (LDW)',
        'Lane departure assist (LDA)',
        'Traffic jam assist (TJA)',
        'Traffic sign recognition (TSR)',
        'Intelligent speed limit information (ISLI)',
        'Intelligent speed limit control (ISLC)',
      ],
      'Parking': [
        '360° camera',
        'Front parking sensors (2)',
        'Rear parking sensors (4)',
      ],
      'Powertrain & Charging': [
        '45.12 kWh Blade Battery',
        '130 kW front motor',
        '8-in-1 electric powertrain',
        'e-Platform 3.0',
        'Heat-pump thermal management',
        'CCS2 DC fast charging up to 82 kW',
        'Type 2 AC charging at 7 kW',
        'Portable Mode 2 charging cable',
        'Vehicle-to-load (V2L)',
        'Eco / Normal / Sport drive modes',
      ],
      'Infotainment & Connectivity': [
        '12.8-inch rotating touchscreen',
        '8.8-inch LCD instrument cluster',
        'Apple CarPlay and Android Auto',
        'BYD Super App',
        '8 speakers',
      ],
      'Seats & Interior': [
        'Faux-leather upholstery',
        '6-way power driver seat',
        '4-way power passenger seat',
        'Ventilated front seats',
        'Black interior',
      ],
      'Comfort & Convenience': [
        'Keyless entry and start',
        'NFC card key / digital key',
        '50 W ventilated wireless phone charger',
        'Climate control with rear air vents',
        'CN95 cabin air filter',
        'One-touch up/down windows on all four doors with anti-pinch',
        'Auto-dimming rear-view mirror',
        'Tyre repair kit and toolkit',
      ],
      'Exterior & Lighting': [
        'LED headlights with daytime running lights',
        'Follow-me-home headlights',
        'Möbius-ring full-width LED tail light',
        'Heated, power-adjustable, power-folding mirrors',
        '17-inch alloy wheels (215/60 R17)',
      ],
    },
    sources: [
      'https://cache1.pakwheels.com/system/brochures/1466/original/BYD_Atto_2_Flyer_Revised_03_%28Final_20012026%29.pdf?1768909635',
      'https://www.byd-mega.com/brochure/new/atto-2-brochure-aug-2026.pdf',
      'https://www.byd-mega.com/vehicles/atto-2',
    ],
    checked: '2026-10-30',
  },
  'byd-atto-3-advanced': {
    groups: {
      'Safety': [
        'Seven airbags (front, front side, side curtain, driver far-side)',
        'Load-limiting pretensioner seat belts',
        '5-star ANCAP (2023)',
        'High-strength steel body structure',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control (ACC)',
        'Blind spot detection (BSD)',
        'Rear cross-traffic alert (RCTA)',
        'Rear cross-traffic brake (RCTB)',
        'Door open warning (DOW)',
        'Lane departure warning (LDW)',
        'Lane departure prevention (LDP)',
      ],
      'Parking': [
        '360° around-view monitor',
      ],
      'Powertrain & Charging': [
        '49.92 kWh Blade Battery',
        '150 kW / 310 Nm front motor',
        '8-in-1 electric powertrain',
        'e-Platform 3.0',
        'Heat-pump system',
        'CCS2 DC fast charging up to 88 kW',
        'Vehicle-to-load (V2L) up to 2.2 kW',
        'Multiple drive modes',
        '0.29 Cd drag coefficient',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch rotating touchscreen',
        'Wireless Apple CarPlay and Android Auto',
        'Voice control',
        'Split-screen apps',
        'Premium sound system',
      ],
      'Seats & Interior': [
        'Single-tone sports seats',
        'Powered front seats',
        'Interactive rhythmic ambient lighting',
        'Multifunction steering wheel',
        'Electronic gear selector',
      ],
      'Comfort & Convenience': [
        'Panoramic sunroof with electric slide and anti-pinch (1,261 × 849 mm)',
        'One-touch electric tailgate with anti-pinch and adjustable height',
        'Wireless phone charger',
        'NFC card key',
        'Up to 1,340 L of luggage space with rear seats folded',
      ],
      'Exterior & Lighting': [
        'Crystal LED combination headlights',
        'One-piece LED headlight strip',
        'Full-width LED tail light strip',
        'Adaptive front lighting (AFL)',
        'Ripple D-pillar trim',
      ],
    },
    sources: [
      'https://www.byd-mega.com/brochure/new/atto-3-brochure-aug-2026.pdf',
      'https://www.byd-mega.com/vehicles/atto-3',
    ],
    checked: '2026-10-30',
  },
  'byd-seal': {
    trim: 'Dynamic',
    groups: {
      'Safety': [
        'Seven airbags (front, front side, side curtain, driver far-side, rear side)',
        'Dual-stage front seat-belt pretensioners',
        'Rear seat-belt pretensioners',
        'Front and rear seat-belt reminders',
        'Traction control (TCS)',
        'Electronic brake-force distribution (EBD)',
        'Hill hold control',
        'Auto-hold',
        'Intelligent power brake system',
        'ISOFIX child-seat anchors',
        '5-star ANCAP (2023)',
        'Cell-to-Body (CTB) battery structure',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control (ACC)',
        'Intelligent cruise control (ICC)',
        'Automatic emergency braking (AEB)',
        'Predictive collision warning (PCW)',
        'Lane departure warning (LDW)',
        'Lane departure prevention (LDP)',
        'Emergency lane keeping assist (ELKA)',
        'Blind spot detection (BSD)',
        'Door open warning (DOW)',
        'Front cross-traffic alert and brake (FCTA/FCTB)',
        'Rear cross-traffic alert and brake (RCTA/RCTB)',
        'Traffic sign recognition (TSR)',
        'Intelligent speed limit information and control (ISLI/ISLC)',
        'High beam assist (HMA)',
        'Driver attention warning (DAW)',
      ],
      'Parking': [
        '360° camera',
        'Front parking sensors (2 zones)',
        'Rear parking sensors (4 zones)',
      ],
      'Powertrain & Charging': [
        '61.44 kWh Blade Battery',
        '150 kW / 310 Nm rear motor',
        'e-Platform 3.0',
        'CCS2 DC fast charging up to 110 kW',
        'Type 2 AC charging at 7 kW',
        'Portable Mode 2 charging cable',
        'Vehicle-to-load (V2L) with discharge adapter',
        'Regenerative braking',
        'Double-wishbone front / multi-link rear suspension',
        'Ventilated front and rear disc brakes',
        '0.219 Cd drag coefficient',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch rotating touchscreen',
        '10.25-inch digital instrument cluster',
        'Dynaudio 12-speaker sound system',
        'English voice assistant',
        'Bluetooth phone and audio streaming',
        'FM radio',
        'USB-C and USB-A ports front and rear',
      ],
      'Seats & Interior': [
        'Imitation-leather seats',
        'Imitation-leather steering wheel',
        '8-way power driver seat',
        '6-way power passenger seat',
        'Heated and ventilated front seats',
        '60/40 split-folding rear seat',
        'Rear centre armrest with cup holders',
        'RGB ambient lighting with rhythm function',
        'Crystal gear selector',
      ],
      'Comfort & Convenience': [
        'Keyless entry and start',
        'NFC card key',
        'Dual wireless phone chargers',
        'Automatic dual-zone heat-pump climate control',
        'PM2.5 filtration with CN95 filter',
        'Negative-ion air purifier',
        'Rear air vents',
        'Rain-sensing frameless wipers',
        'Auto-dimming rear-view mirror',
        'One-touch power tailgate',
        '50 L front trunk',
        'Silver-plated panoramic glass roof',
        'Heated rear windscreen',
        '12V accessory socket',
      ],
      'Exterior & Lighting': [
        'LED headlights with daytime running lights',
        'Follow-me-home headlights',
        'Full-width LED tail light',
        'Sequential rear indicators',
        'Rear fog light',
        'Flush electric door handles',
        'Heated, power-adjustable, power-folding mirrors',
        'Double-glazed windscreen and front-door glass',
        '18-inch alloy wheels (225/50 R18)',
      ],
    },
    sources: [
      'https://cache3.pakwheels.com/system/brochures/280/original/SEAL-BROCHURE.pdf?1746435676',
      'https://www.byd-mega.com/brochure/BYD-SEAL.pdf',
      'https://www.byd-mega.com/vehicles/seal',
    ],
    checked: '2026-10-30',
  },
  'byd-sealion-7-advanced': {
    groups: {
      'Safety': [
        '9 airbags incl. front centre airbag and full-length side curtains',
        'Blade Battery (nail-penetration tested)',
        'Cell-to-Body (CTB) structure on e-Platform 3.0',
        'Driver fatigue monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Automatic emergency braking (AEB)',
        'Adaptive cruise control (ACC)',
        'Blind spot detection (BSD)',
        'Door open warning (DOW)',
        'Lane departure warning and prevention (LDW/LDP)',
        'Emergency lane keeping assist (ELKA)',
        'Rear cross traffic alert and braking (RCTA/RCTB)',
      ],
      'Powertrain & Charging': [
        '82.56 kWh Blade Battery (LFP)',
        '230 kW / 380 Nm rear motor',
        '8-in-1 electric powertrain',
        '30-80% fast charge within 30 min',
        'Vehicle-to-Load (V2L) up to 3.3 kW',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch rotating touchscreen',
        '10.25-inch digital instrument cluster',
        'Windshield head-up display with ADAS and navigation',
        '\x27Hi BYD\x27 voice control',
        '12-speaker Dynaudio sound system',
      ],
      'Seats & Interior': [
        'Quilted leather seats',
        'Driver seat and mirror memory',
        '128-colour ambient lighting synced to audio',
        'Panoramic sunroof with electric sunshade',
        '58 L front trunk, 500 L boot (1,769 L seats folded)',
      ],
      'Comfort & Convenience': [
        '50 W ventilated wireless phone charger',
        'Keyless access via NFC card or smartphone',
        'Foot-gesture electric tailgate',
        'Double-glazed acoustic glass',
        'Double-wishbone front / five-link rear suspension with FSD dampers',
      ],
      'Exterior & Lighting': [
        'Double-U floating LED headlights',
        'Full-width \x27water drop\x27 tail lamps',
        '19-inch alloy wheels with fixed calipers',
        'Electronic flush door handles',
      ],
    },
    sources: [
      'https://byd-mega.com/brochure/new/sealion-7-brochure-aug-2026.pdf',
      'https://byd-mega.com/vehicles/sealion-7',
    ],
    checked: '2026-10-30',
  },
  'byd-shark-6': {
    groups: {
      'Safety': [
        '7 airbags (front, side, curtain)',
        'ISOFIX on rear outer seats',
        'Child presence detection',
        'Vehicle dynamic control (VDC)',
        'Trailer stability control',
      ],
      'Driver Assistance (ADAS)': [
        'Automatic emergency braking (AEB)',
        'Forward collision warning (FCW)',
        'Rear collision warning (RCW)',
        'Lane departure warning and prevention (LDW/LDP)',
        'Emergency lane keeping assist (ELKA)',
        'Blind spot detection (BSD)',
        'Front cross traffic alert and braking',
        'Rear cross traffic alert and braking',
        'Intelligent cruise control',
      ],
      'Parking': [
        '360-degree HD camera',
      ],
      'Powertrain & Charging': [
        'DM-O plug-in hybrid with 1.5-litre turbo engine',
        'Dual-motor AWD (436 hp / 650 Nm combined)',
        '29.58 kWh Blade Battery',
        '7 kW AC (Type 2) and 55 kW DC (CCS2) charging',
        'Vehicle-to-Load (V2L)',
        '230 W socket in the cargo bed',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch central touchscreen',
        'BYD intelligent cockpit',
        'BYD app remote controls',
      ],
      'Comfort & Convenience': [
        'Keyless entry',
        'Remote start',
        'NFC card digital key',
        '50 W ventilated wireless charger',
        'Sport, Normal and Eco drive modes',
        'Mud, Snow, Mountain and Sand terrain modes',
        'Hill hold control and hill descent control',
        'Long-travel double-wishbone suspension',
      ],
      'Exterior & Lighting': [
        'Ladder-frame off-road chassis',
        'Steel underbody protection plate',
        '2,500 kg towing capacity',
        '700 mm wading depth',
      ],
    },
    sources: [
      'https://byd-mega.com/brochure/new/shark-6-brochure-aug-2026.pdf',
      'https://byd-mega.com/vehicles/shark',
    ],
    checked: '2026-10-30',
  },
}

/** The features for one car, in display order, or null when none are recorded. */
export function getCarFeatures(slug: string): {
  trim?: string
  groups: Array<{ title: FeatureGroup; items: string[] }>
  sources: string[]
  checked: string
} | null {
  const entry = CAR_FEATURES[slug]
  if (!entry) return null
  const groups = FEATURE_GROUP_ORDER.flatMap((title) => {
    const items = entry.groups[title]
    return items && items.length > 0 ? [{ title, items }] : []
  })
  if (groups.length === 0) return null
  return { trim: entry.trim, groups, sources: entry.sources, checked: entry.checked }
}
