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

  // MG, from MG Pakistan's spec sheets and brochures (mgmotors.com.pk), with
  // PakNEV's per-trim lists for the cars MG's own material does not itemise.
  // The ZS EV and MG5 EV, no longer on MG Pakistan's site, are from PakNEV alone.
  'mg-zs-hybrid-plus': {
    trim: 'Hybrid+ Essence (the Excite differences are noted)',
    groups: {
      'Safety': [
        'Six airbags: front, side and curtain',
        'Stability programme (ESP) with ABS, EBD and traction control',
        'Hill start assist and auto hold',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX on both rear outer seats',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and intelligent cruise assist',
        'Autonomous emergency braking (AEB)',
        'Forward and rear collision warning',
        'Lane keep assist, lane departure warning and emergency lane keep',
        'Lane change assist and blind spot detection',
        'Rear cross traffic alert',
        'Door opening warning',
        'Intelligent speed limit assist',
        'Intelligent headlight control',
      ],
      'Parking': [
        '360° camera',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Self-charging hybrid, no plug needed',
        '1.5-litre petrol engine with a 3-speed hybrid transmission',
        '158 kW (212 hp) and 465 Nm combined',
        '1.83 kWh hybrid battery',
        'Eco, Normal and Sport drive modes (Excite and Essence)',
        'Three energy regeneration levels (Excite and Essence)',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen',
        '12.3-inch digital instrument cluster',
        'Wireless Apple CarPlay and Android Auto',
        'MG iSMART connected-car app (12 months included)',
        'Six speakers and four USB ports',
      ],
      'Seats & Interior': [
        'PVC upholstery (fabric on the Excite)',
        '6-way electric driver seat (manual on the Excite)',
        'Ventilated front seats (Essence)',
        '60/40 split-folding rear seat (Essence)',
        'Leather steering wheel (PU on the Excite)',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'Automatic climate control with rear AC vents',
        'Electric parking brake',
        'Power tailgate (Essence)',
        'Tilt and telescopic steering wheel',
      ],
      'Exterior & Lighting': [
        'Electric panoramic sunroof (Essence)',
        '18-inch alloy wheels (17-inch on the Excite)',
        'LED headlights, daytime running lights and taillights',
        'Automatic headlights and rain-sensing wipers',
        'Heated, power-folding door mirrors',
        'Silver roof rails',
      ],
    },
    sources: [
      'https://mgmotors.com.pk/assets/brochure/mg-zs-spec-sheet.pdf',
      'https://paknev.com/cars/mg-zs-hybrid-plus',
    ],
    checked: '2026-11-02',
  },
  'mg-hs-hev': {
    trim: 'HS Hybrid+',
    groups: {
      'Safety': [
        'Seven airbags, including a far-side airbag between the front seats',
        'Electronic stability programme',
        'Hill start assist and auto hold',
        'Direct tyre pressure monitoring (TPMS)',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and intelligent cruise assist',
        'Autonomous emergency braking (AEB)',
        'Forward and rear collision warning',
        'Lane keep assist, lane departure warning and emergency lane keep',
        'Lane change assist and blind spot detection',
        'Front cross traffic alert and rear cross traffic braking',
        'Driver monitoring system',
        'Door open warning',
        'Intelligent speed limit assist',
        'Intelligent headlight control',
      ],
      'Parking': [
        'HD 360° camera with a 540° see-through-the-car view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Self-charging hybrid, no plug needed',
        '1.5-litre turbo engine and 146 kW traction motor',
        '165 kW (221 hp) and 340 Nm combined',
        '1.83 kWh hybrid battery',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen',
        '12.3-inch digital driver display',
        'Wireless Apple CarPlay and Android Auto',
        'MG iSMART connectivity',
        'Eight-speaker audio',
        'Wireless phone charging',
      ],
      'Seats & Interior': [
        'PVC upholstery in tan or black',
        '6-way electric driver seat with 3-position memory',
        '4-way electric lumbar support for the driver',
        '4-way electric passenger seat',
        'Heated front seats (3 levels)',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear AC vents',
        'Electric parking brake',
        'Anti-trap one-touch windows all round',
        'Tilt and telescopic steering wheel',
      ],
      'Exterior & Lighting': [
        'Electric panoramic sunroof with anti-trap',
        '19-inch alloy wheels',
        'LED headlights, daytime running lights and taillights',
        'Automatic headlights, front and rear fog lights',
        'Heated, power-folding mirrors with memory',
        'Rear privacy glass and silver roof rails',
      ],
    },
    sources: [
      'https://mgmotors.com.pk/assets/brochure/Hybrid-plus-Back-Updated.pdf',
      'https://paknev.com/cars/mg-hs-hybrid',
    ],
    checked: '2026-11-02',
  },
  'mg-hs-phev': {
    trim: 'HS Super Hybrid',
    groups: {
      'Safety': [
        'Seven airbags, including a far-side airbag between the front seats',
        'Electronic stability programme',
        'Hill start assist and auto hold',
        'Direct tyre pressure monitoring (TPMS)',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and intelligent cruise assist',
        'Autonomous emergency braking (AEB)',
        'Forward and rear collision warning',
        'Lane keep assist, lane departure warning and emergency lane keep',
        'Lane change assist and blind spot detection',
        'Front cross traffic alert and rear cross traffic braking',
        'Driver monitoring system',
        'Door open warning',
        'Intelligent speed limit assist',
        'Intelligent headlight control',
      ],
      'Parking': [
        'HD 360° camera with a 540° see-through-the-car view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Plug-in hybrid: 1.5-litre turbo engine and 154 kW traction motor',
        '220 kW (295 hp) and 350 Nm combined',
        '24.7 kWh battery, 135 km electric range (NEDC)',
        'Type 2 AC charging: about 4 hours on a 7 kW charger',
        'Portable charger included (about 7.5 hours for a full charge)',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen',
        '12.3-inch digital driver display',
        'Wireless Apple CarPlay and Android Auto',
        'MG iSMART connectivity',
        'Eight-speaker audio',
        'Wireless phone charging',
      ],
      'Seats & Interior': [
        'PVC upholstery in tan or black',
        '6-way electric driver seat with 3-position memory',
        '4-way electric lumbar support for the driver',
        '4-way electric passenger seat',
        'Heated front seats (3 levels)',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear AC vents',
        'Heated rear window',
        'Electric parking brake',
        'Anti-trap one-touch windows all round',
      ],
      'Exterior & Lighting': [
        'Electric panoramic sunroof with anti-trap',
        '19-inch alloy wheels',
        'Side steps',
        'LED headlights, daytime running lights and taillights',
        'Automatic headlights, front and rear fog lights',
        'Heated, power-folding mirrors with memory',
        'Rear privacy glass and silver roof rails',
      ],
    },
    sources: [
      'https://mgmotors.com.pk/assets/brochure/Super-Hybrid-Updated.pdf',
      'https://paknev.com/cars/mg-hs-phev',
    ],
    checked: '2026-11-02',
  },
  'mg-4-urban': {
    trim: 'MG4 EV Urban',
    groups: {
      'Safety': [
        'Seven airbags, including a far-side airbag',
        'Stability programme with hill descent control and auto hold',
        'Direct tyre pressure monitoring (TPMS)',
        'Child presence detection',
        'Automatic door locking by speed and unlocking after a crash',
      ],
      'Driver Assistance (ADAS)': [
        'MG Pilot: adaptive cruise control and intelligent cruise assist',
        'Autonomous emergency braking (AEB)',
        'Forward and rear collision warning',
        'Lane keep assist, lane departure warning and emergency lane keep',
        'Lane change assist and blind spot detection',
        'Rear cross traffic alert and braking',
        'Driver monitoring system',
        'Door open warning',
        'Intelligent speed limit assist',
        'Intelligent high-beam control',
      ],
      'Parking': [
        '540° camera (360° with a see-through-the-car view)',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        '43 kWh LFP battery, 316 km range (WLTP)',
        '110 kW (148 hp) and 250 Nm, 0–100 km/h in 9 s',
        'CCS2 DC fast charging up to 82 kW: 10–80% in about 28 min',
        '6.6 kW on-board AC charger',
        'Vehicle-to-load (V2L)',
        'One-pedal mode and four regeneration settings',
        'Battery thermal management',
      ],
      'Infotainment & Connectivity': [
        '12.8-inch touchscreen',
        '7-inch digital driver display',
        'Wireless and wired Apple CarPlay and Android Auto',
        'Six-speaker audio',
        '15 W wireless phone charger',
        'Three USB-C ports',
      ],
      'Seats & Interior': [
        'PVC upholstery',
        '6-way electric driver seat',
        'Heated front seats and heated steering wheel',
        '40/60 split-folding rear seat',
        'Ambient lighting',
      ],
      'Comfort & Convenience': [
        'Keyless entry and pedal start',
        'Automatic climate control with rear air vents',
        'Heated rear window',
        'Two-level boot floor',
      ],
      'Exterior & Lighting': [
        '17-inch alloy wheels',
        'LED headlights, daytime running lights and taillights',
        'Automatic headlights and follow-me-home lights',
        'Heated, power-folding door mirrors',
        'Rear privacy glass, roof rack and spoiler',
        'Active grille shutters',
      ],
    },
    sources: ['https://mgmotors.com.pk/assets/brochure/MG4_EV_Urban_Brochure.pdf'],
    checked: '2026-11-02',
  },
  'mg-binguo': {
    trim: 'Pro',
    groups: {
      'Safety': [
        'Driver and front passenger airbags',
        'ABS with EBD and electronic stability control',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Disc brakes front and rear',
        'Immobiliser',
      ],
      'Parking': [
        'Reversing camera',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        '31.9 kWh LFP battery with IP67 protection',
        '50 kW (67 hp) front motor, single-speed',
        'Up to 333 km range (CLTC)',
        'DC fast charging: 30–80% in about 35 min',
        'AC charging: 20–100% in about 5.5 hours',
        'Rotary gear selector',
      ],
      'Infotainment & Connectivity': [
        'Two 10.25-inch colour screens (driver display and touchscreen)',
        'Four speakers',
        'USB port',
      ],
      'Seats & Interior': [
        'Synthetic leather seats',
        '6-way electric driver seat',
        'Leather-wrapped multifunction steering wheel',
        'Up to 790 L of luggage space with the rear seats folded',
        '15 storage spaces',
      ],
      'Comfort & Convenience': [
        'Keyless entry and smart start',
        'Cruise control',
        'Electric parking brake with auto hold',
        'Electronic AC',
        'Auto up/down power windows',
      ],
      'Exterior & Lighting': [
        'X-shaped LED front and rear lamps',
        'Two-tone paint',
        'Diamond-pattern grille',
        'Electric folding door mirrors',
        'Frameless wipers and rear defogger',
        '15-inch steel wheels with two-tone covers',
      ],
    },
    sources: [
      'https://mgmotors.com.pk/assets/brochure/Binguo-Brochure.pdf',
      'https://paknev.com/cars/mg-binguo-ev',
    ],
    checked: '2026-11-02',
  },
  'mg-cyberster': {
    groups: {
      'Driver Assistance (ADAS)': [
        'MG Pilot Level 2 driver assistance',
        'Adaptive cruise control',
        'Forward collision warning',
        'Lane keep assist',
        'Blind spot detection',
        'Rear cross traffic alert',
        'Driver fatigue monitoring',
      ],
      'Parking': [
        '360° camera with a 540° see-through-the-car view',
      ],
      'Powertrain & Charging': [
        'Launch control',
        'One-pedal driving mode',
        'Steering-wheel paddles for regeneration levels',
        'Super Sport mode button on the steering wheel',
      ],
      'Infotainment & Connectivity': [
        'Wraparound three-screen cockpit',
        '10.25-inch digital driver display with two 7-inch side screens',
        'Separate 7-inch climate screen',
        'MG iSMART with live navigation and EV route planning',
        'Voice control and over-the-air updates',
        'Eight-speaker Bose audio',
      ],
      'Seats & Interior': [
        'Heated sports seats in suede and leather',
        '8-way electric driver seat',
        'Flat-bottomed microfibre-leather steering wheel',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control',
        'Keyless entry and start',
        'Doors that open from the key fob',
      ],
      'Exterior & Lighting': [
        'Electric scissor doors',
        'Electric soft top that opens or closes in about 10 seconds',
        'Kammback tail and active front air flaps',
        'Storm-eye LED headlights and arrow-shaped LED taillights',
        'F1-style rear fog light',
        '20-inch lightweight alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/mg-cyberster', 'https://mgmotors.com.pk/model/cyberster'],
    checked: '2026-11-02',
  },
  'mg-zs-ev': {
    trim: 'MCE Essence',
    groups: {
      'Safety': [
        'Six airbags',
        'Electronic stability control',
        'Hill start assist and hill descent control',
      ],
      'Driver Assistance (ADAS)': [
        'MG Pilot active safety suite',
        'Adaptive cruise control and traffic jam assist',
        'Autonomous emergency braking (AEB)',
        'Lane keep assist',
        'Blind spot monitoring',
        'Intelligent high-beam control',
      ],
      'Parking': [
        '360° camera',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        '51.1 kWh battery, 360 km range (WLTP)',
        'DC fast charging up to 75 kW: 10–80% in about 40 min',
        '7 kW AC charging',
        'Vehicle-to-load (V2L)',
        'Three regenerative braking levels',
      ],
      'Infotainment & Connectivity': [
        '10.1-inch touchscreen',
        'Digital instrument cluster',
        'Apple CarPlay and Android Auto',
        'Wireless phone charging',
      ],
      'Seats & Interior': [
        'Synthetic leather seats',
        '6-way electric driver seat',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'Automatic climate control with PM2.5 air filter',
        'Auto hold',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'LED projector headlights and daytime running lights',
        '17-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/mg-zs-ev'],
    checked: '2026-11-02',
  },
  'mg-zs-ev-long-range': {
    trim: 'MCE Long Range',
    groups: {
      'Safety': [
        'Six airbags',
        'Electronic stability control',
        'Hill descent control',
      ],
      'Driver Assistance (ADAS)': [
        'MG Pilot driver assistance suite',
        'Adaptive cruise control',
        'Forward collision warning',
        'Autonomous emergency braking (AEB)',
        'Lane change assist',
        'Rear cross traffic alert',
      ],
      'Parking': [
        '360° parking camera',
      ],
      'Powertrain & Charging': [
        '72.6 kWh NMC battery, 505 km range (WLTP)',
        'DC fast charging up to 92 kW: 10–80% in about 42 min',
        '11 kW AC charging',
        'Vehicle-to-load (V2L)',
        'Three-stage brake energy recovery',
        'Rotary gear selector',
      ],
      'Infotainment & Connectivity': [
        '10.1-inch HD touchscreen',
        'Fully digital instrument cluster',
        'Wireless Apple CarPlay and Android Auto',
        'Smart connectivity apps',
      ],
      'Seats & Interior': [
        'Leather-look seats',
        'Heated front seats',
        '6-way electric driver seat',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'Automatic climate control with PM2.5 air filter',
        'Auto hold',
        'Auto-dimming rear-view mirror',
      ],
      'Exterior & Lighting': [
        'Panoramic sky roof',
        'LED headlights with dusk sensor',
        '17-inch alloy wheels',
        'Integrated roof rails',
      ],
    },
    sources: ['https://paknev.com/cars/mg-zs-ev'],
    checked: '2026-11-02',
  },
  'mg-5-ev': {
    trim: 'Long Range',
    groups: {
      'Safety': [
        'Six airbags',
        'Electronic stability control',
        'Hill start assist',
      ],
      'Driver Assistance (ADAS)': [
        'MG Pilot active safety suite',
        'Adaptive cruise control and traffic jam assist',
        'Autonomous emergency braking (AEB)',
        'Lane keep assist and lane departure warning',
        'Intelligent speed limit assist',
      ],
      'Parking': [
        '360° parking camera',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        'NMC (nickel manganese cobalt) battery',
        'Three regenerative braking modes',
        'Vehicle-to-load (V2L)',
        'Rotary gear selector',
      ],
      'Infotainment & Connectivity': [
        '10.25-inch touchscreen',
        '7-inch virtual driver display',
        'Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Fabric and leather upholstery',
        '6-way adjustable driver seat',
      ],
      'Comfort & Convenience': [
        'Smart keyless entry and push-button start',
        'Automatic air conditioning with PM2.5 filter',
        'Auto hold',
      ],
      'Exterior & Lighting': [
        'LED headlights with automatic lighting',
        'LED daytime running lights',
        '16-inch alloy wheels',
        'Integrated silver roof rails',
      ],
    },
    sources: ['https://paknev.com/cars/mg5-ev'],
    checked: '2026-11-02',
  },

  // Alektra, from PakNEV's model pages. Alektra publishes no spec sheet of its
  // own. Each list covers all three battery variants of its model, which share
  // the equipment and differ only in the pack (in the spec sheet).
  'alektra-mini-x2': {
    groups: {
      'Safety': [
        'Front disc brakes, rear drum brakes',
      ],
      'Powertrain & Charging': [
        'Rear-wheel drive',
        'Charges from a 220V home socket',
        'Eco driving mode',
      ],
      'Infotainment & Connectivity': [
        'Digital instrument display',
        'Bluetooth audio',
      ],
      'Seats & Interior': [
        'Two adult seats',
        'Small fold-down rear bench for cargo or small children',
      ],
      'Comfort & Convenience': [
        'Front power windows',
        'Air vents with a cabin cooling fan',
      ],
      'Exterior & Lighting': [
        'LED headlights',
        'Alloy wheels',
        'Compact two-door body for city streets',
      ],
    },
    sources: ['https://paknev.com/cars/alektra-mini-x2'],
    checked: '2026-11-02',
  },
  'alektra-mini-x4': {
    groups: {
      'Powertrain & Charging': [
        'Rear-wheel drive',
        'Charges from a 220V home socket',
        'Power steering',
        'Raised suspension for extra clearance',
      ],
      'Infotainment & Connectivity': [
        'Digital multi-information display',
        'Touchscreen entertainment unit',
        'USB phone-charging ports',
      ],
      'Seats & Interior': [
        'Seats for four adults',
        '4-way manually adjustable driver seat',
        'Luggage space behind the rear seats',
      ],
      'Comfort & Convenience': [
        'Air conditioning',
        'Cabin heater',
        'Central locking',
      ],
      'Exterior & Lighting': [
        'Four-door body',
        '12-inch wheels and tyres for city use',
      ],
    },
    sources: ['https://paknev.com/cars/alektra-mini-x4'],
    checked: '2026-11-02',
  },
  'alektra-solar-mini-x4': {
    groups: {
      'Parking': [
        'Reversing camera shown on the touchscreen',
      ],
      'Powertrain & Charging': [
        'Roof-mounted monocrystalline solar panel',
        'Solar trickle-charging while parked or driving',
        'Up to about 50 km of extra range a day from the sun (Alektra claim)',
        'LFP battery',
        'Regenerative braking',
        'Rear-wheel drive',
        'Charges from a 220V home socket',
      ],
      'Infotainment & Connectivity': [
        'Touchscreen infotainment',
      ],
      'Seats & Interior': [
        'Seats for four adults',
        'Upgraded dashboard finish',
      ],
      'Comfort & Convenience': [
        'Climate control',
        'Central locking with remote keyless entry',
      ],
      'Exterior & Lighting': [
        'Four-door body',
        'LED daytime running lights',
      ],
    },
    sources: ['https://paknev.com/cars/alektra-solar-mini-x4'],
    checked: '2026-11-02',
  },
}

// The two Cyberster trims share one equipment list; only the drivetrain
// differs, and that is in the spec sheet.
CAR_FEATURES['mg-cyberster-gt-dual'] = CAR_FEATURES['mg-cyberster']!

// Each Alektra's Standard and Long Range packs share the Base's equipment.
for (const model of ['alektra-mini-x2', 'alektra-mini-x4', 'alektra-solar-mini-x4']) {
  CAR_FEATURES[`${model}-standard`] = CAR_FEATURES[model]!
  CAR_FEATURES[`${model}-long-range`] = CAR_FEATURES[model]!
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
