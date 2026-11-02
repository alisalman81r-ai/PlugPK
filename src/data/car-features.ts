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

  // Audi. The Q6 list is PakNEV's; PakNEV has none for the others, so theirs
  // come from PakWheels' Pakistan pages, keeping only items stated for the
  // car sold here and leaving out what PakWheels marks as optional.
  'audi-q6-e-tron': {
    trim: 'quattro',
    groups: {
      'Safety': [
        'Front, side and curtain airbags',
        'Tyre pressure monitoring (TPMS)',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Autonomous emergency braking (AEB)',
        'Lane departure warning and lane change assist',
        'Swerve assist and turn assist',
        'Intersection assist',
        'Rear cross traffic assist',
        'Exit warning for opening doors',
        'Traffic sign recognition',
        'Matrix-beam high-beam assist',
      ],
      'Parking': [
        '360° top-view camera',
      ],
      'Powertrain & Charging': [
        '800-volt system, up to 270 kW DC: 10–80% in about 21 min',
        '11 kW AC charging',
        'quattro all-wheel drive',
      ],
      'Infotainment & Connectivity': [
        'MMI panoramic display: 11.9-inch virtual cockpit and 14.5-inch touchscreen',
        'Android Automotive operating system',
        'Over-the-air software updates',
        'Audi sound system',
      ],
      'Seats & Interior': [
        'Power-adjustable front seats with driver memory',
        'Heated steering wheel',
        'Ambient lighting',
        'Soft-touch dashboard and recycled-fabric upholstery',
      ],
      'Comfort & Convenience': [
        'Multi-zone automatic climate control',
        'Keyless entry and start',
        'Power tailgate with gesture opening',
        'Auto-dimming rear-view mirror',
      ],
      'Exterior & Lighting': [
        'Digital matrix LED headlights',
        'Active digital OLED taillights with 8 selectable light signatures',
        'Electric panoramic sunroof',
      ],
    },
    sources: ['https://paknev.com/cars/audi-q6-e-tron'],
    checked: '2026-11-02',
  },
  'audi-a6-e-tron': {
    trim: 'Sportback Signature and Executive Edition',
    groups: {
      'Safety': [
        'Eight airbags',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Autonomous emergency braking and front collision assist',
        'Lane assist',
        'Rear cross traffic warning',
        'Exit warning for opening doors',
        'Driver fatigue and distraction warning',
        'Parking assist',
      ],
      'Powertrain & Charging': [
        '800-volt system, up to 225 kW DC: 10–80% in about 21 min',
        '11 kW AC charging',
        'Efficiency, Comfort, Auto, Dynamic and Individual drive modes',
      ],
      'Infotainment & Connectivity': [
        '14.5-inch MMI touchscreen',
        '11.9-inch Audi virtual cockpit',
        'Wireless Apple CarPlay and Android Auto',
        'Navigation, Bluetooth and voice control',
        'Wireless phone charging',
        '16-speaker audio (Signature)',
      ],
      'Seats & Interior': [
        'Leather seats with power adjustment and driver lumbar support',
        'Heated seats with memory',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with rear AC vents',
        'Power tailgate',
      ],
      'Exterior & Lighting': [
        'Digital lighting with selectable daytime-running and rear-light signatures',
        '19-inch alloy wheels',
        'Drag coefficient of 0.21',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/audi/a6-e-tron/'],
    checked: '2026-11-02',
  },
  'audi-e-tron-gt': {
    trim: 'RS',
    groups: {
      'Safety': [
        'Ten airbags',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Forward collision warning and automatic emergency braking',
        'Remote self-parking from a smartphone app',
      ],
      'Parking': [
        'Parking aid plus with 360° display',
      ],
      'Powertrain & Charging': [
        '800-volt system, up to 270 kW DC: about 22.5 min to 80%',
        'Two motors and all-wheel drive with a two-speed rear gearbox',
        'Boost mode for extra power on launch',
      ],
      'Infotainment & Connectivity': [
        '10.1-inch central touchscreen',
        'Digital instrument cluster',
        'Head-up display',
        'Apple CarPlay and Android Auto',
        '16-speaker audio',
        'Wireless phone charging',
      ],
      'Seats & Interior': [
        'Heated and ventilated power front seats with driver memory',
        'D-shaped leather steering wheel with electric adjustment',
        'Ambient lighting',
        'Leather-free interior available',
      ],
      'Comfort & Convenience': [
        'Climate control with rear AC vents',
        'Comfort key with sensor-operated boot release',
        'Heated, power-folding, auto-dimming mirrors with memory',
        'Auto-dimming rear-view mirror',
      ],
      'Exterior & Lighting': [
        'Matrix LED headlights with Audi laser light',
        'Dynamic lighting sequences and dynamic turn signals front and rear',
        'Panoramic glass roof',
        '20-inch alloy wheels',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/audi/e-tron-gt/'],
    checked: '2026-11-02',
  },
  'audi-q8-e-tron': {
    trim: '50 quattro',
    groups: {
      'Safety': [
        'Eight airbags',
      ],
      'Powertrain & Charging': [
        'quattro all-wheel drive',
        'Up to 150 kW DC and 11 kW AC charging',
      ],
      'Infotainment & Connectivity': [
        'Navigation',
        'Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Heated seats',
      ],
      'Comfort & Convenience': [
        'Power tailgate',
        'Rear AC vents',
        'Adaptive air suspension',
      ],
      'Exterior & Lighting': [
        '20-inch wheels',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/audi/q8-e-tron/', 'https://paknev.com/cars/audi-q8-e-tron'],
    checked: '2026-11-02',
  },

  // BMW, from PakNEV's per-model lists, keeping the items for the version
  // Dewan Motors sells (PakNEV prints the base and top trims' lists one after
  // the other). The iX and i7 lists add BMW equipment reported for the same
  // versions by paultan.org and BMW Pakistan's i7 page (via PakWheels).
  'bmw-ix1': {
    trim: 'xDrive30',
    groups: {
      'Safety': [
        'Active Protection crash preparation',
        'M Sport brakes with red calipers',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Driving Assistant',
        'Glare-free adaptive high beam',
        'Head-up display',
      ],
      'Parking': [
        'Reversing camera and parking sensors',
        'Parking Assistant with automatic parking',
      ],
      'Powertrain & Charging': [
        'xDrive all-wheel drive, 313 hp',
        'Adaptive M suspension',
        'Selectable driving modes',
      ],
      'Infotainment & Connectivity': [
        'BMW Curved Display: 10.25-inch driver display and 10.7-inch touchscreen',
        'iDrive 9 with built-in navigation',
        'Wireless Apple CarPlay and Android Auto',
        'Harman Kardon sound system',
        'My BMW app',
      ],
      'Seats & Interior': [
        'Heated front sport seats with electric memory',
        'Alcantara and Sensatec upholstery with blue contrast stitching',
        'Heated M leather steering wheel',
      ],
      'Comfort & Convenience': [
        'Digital Key Plus',
        'Wireless phone charging',
        'Hands-free power tailgate',
        'Touch and voice climate controls',
        'Underfloor charging-cable storage',
      ],
      'Exterior & Lighting': [
        'Adaptive LED headlights',
        'Panoramic sunroof',
        '19-inch M wheels',
        'High-gloss Shadowline trim',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-ix1'],
    checked: '2026-11-02',
  },
  'bmw-ix2': {
    trim: 'xDrive30',
    groups: {
      'Safety': [
        'Active Protection crash preparation',
        'M Sport brakes',
      ],
      'Driver Assistance (ADAS)': [
        'Driving Assistant Plus with adaptive cruise control',
        'Blind spot monitoring and rear cross-traffic alert',
        'Lane departure warning and lane keep assist',
        'Driver attention monitoring',
        'Head-up display',
      ],
      'Parking': [
        'Reversing camera and parking sensors',
        'Parking Assistant',
      ],
      'Powertrain & Charging': [
        'xDrive all-wheel drive, 313 hp',
        'Adaptive M suspension',
        'My Modes personalisation',
      ],
      'Infotainment & Connectivity': [
        'BMW Curved Display: 10.25-inch driver display and 10.7-inch touchscreen',
        'iDrive 9',
        'Wireless Apple CarPlay and Android Auto',
        'Harman Kardon sound system',
        'My BMW app',
      ],
      'Seats & Interior': [
        'Powered, heated M Sport front seats with driver memory',
        'Veganza and Alcantara upholstery',
        'Thick-rimmed M leather steering wheel',
        'Floating centre console',
      ],
      'Comfort & Convenience': [
        'Comfort access and Digital Key Plus',
        'Hands-free power tailgate',
        'Vertical wireless phone charging',
        'Dual-zone climate control',
      ],
      'Exterior & Lighting': [
        'Iconic Glow illuminated kidney grille',
        'Adaptive LED headlights',
        '20-inch M wheels',
        'M Sport styling and coupé-SUV roofline',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-ix2'],
    checked: '2026-11-02',
  },
  'bmw-ix3': {
    trim: '50 xDrive',
    groups: {
      'Safety': [
        'Active Protection crash preparation',
      ],
      'Driver Assistance (ADAS)': [
        'Driving Assistant Professional',
      ],
      'Parking': [
        'Parking Assistant with reversing assistant',
      ],
      'Powertrain & Charging': [
        '800-volt system, up to 400 kW DC: 10–80% in about 21 min',
        'Adaptive suspension',
      ],
      'Infotainment & Connectivity': [
        'BMW Panoramic Vision display across the base of the windscreen',
        'New BMW Operating System',
        'Apple CarPlay and Android Auto',
        'Harman Kardon sound system',
      ],
      'Seats & Interior': [
        'Heated M Sport seats in vegan leather',
        'M Sport steering wheel',
        'Ambient lighting and anthracite headliner',
      ],
      'Comfort & Convenience': [
        'Comfort access and Digital Key Plus',
        'Wireless phone charging',
        'Automatic tailgate',
        'Acoustic glazing',
      ],
      'Exterior & Lighting': [
        'Neue Klasse design with a closed, horizontal kidney grille',
        'Adaptive LED headlights',
        'Panoramic sunroof',
        '20-inch M wheels and M aerodynamic package',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-ix3', 'https://www.pakwheels.com/blog/bmw-neue-klasse-ix3-arrives-pakistan-dewan-motors-2026/'],
    checked: '2026-11-02',
  },
  'bmw-i4': {
    trim: 'eDrive35 (M60 xDrive adds M equipment)',
    groups: {
      'Driver Assistance (ADAS)': [
        'Driving Assistant with forward collision warning',
        'Lane departure warning',
        'Attention assist',
      ],
      'Parking': [
        'Reversing camera',
        'Parking Assistant',
      ],
      'Powertrain & Charging': [
        'Comfort and Eco Pro driving modes',
        'M60: adaptive M suspension, variable sport steering and Sport Boost',
      ],
      'Infotainment & Connectivity': [
        'BMW Curved Display: 12.3-inch driver display and 14.9-inch touchscreen',
        'iDrive 8.5 with the BMW Intelligent Personal Assistant',
        'Wireless Apple CarPlay and Android Auto',
        'My BMW app',
        'M60: Harman Kardon surround sound',
      ],
      'Seats & Interior': [
        'Heated front sport seats in perforated Sensatec',
        'Flat-bottomed M leather steering wheel',
        'Waterfall ambient lighting',
        'M60: Vernasca leather',
      ],
      'Comfort & Convenience': [
        'Comfort access',
        'Wireless phone charging',
        'Power tailgate',
        'Dual-zone automatic climate control',
      ],
      'Exterior & Lighting': [
        'LED headlights and three-dimensional rear lights',
        '19-inch M aerodynamic wheels',
        'M Sport body styling',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-i4'],
    checked: '2026-11-02',
  },
  'bmw-i5': {
    trim: 'eDrive40',
    groups: {
      'Driver Assistance (ADAS)': [
        'Driving Assistant',
        'Lane departure warning and lane change assistant',
      ],
      'Parking': [
        'Reversing camera',
        'Parking Assistant',
      ],
      'Infotainment & Connectivity': [
        'BMW Curved Display: 12.3-inch driver display and 14.9-inch touchscreen',
        'iDrive 8.5',
        'In-car gaming (AirConsole) and video streaming while parked',
        'Wireless Apple CarPlay and Android Auto',
        'Harman Kardon sound system',
        'My BMW app',
      ],
      'Seats & Interior': [
        'BMW Interaction Bar across the dashboard',
        'Heated front sport seats in Veganza',
        'Flat-bottomed M steering wheel',
      ],
      'Comfort & Convenience': [
        'Comfort access',
        'Wireless phone charging',
        'Automatic tailgate',
        'Dual-zone automatic climate control',
        'Underfloor charging-cable storage',
      ],
      'Exterior & Lighting': [
        'Iconic Glow illuminated kidney grille',
        '19-inch M aerodynamic wheels',
        'M Sport exterior styling',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-i5'],
    checked: '2026-11-02',
  },
  'bmw-ix': {
    trim: 'xDrive45',
    groups: {
      'Driver Assistance (ADAS)': [
        'Driving Assistant Professional: adaptive cruise with stop and go, steering and lane-centring assist',
        'Autonomous emergency braking, lane change and departure warning',
        'Traffic sign recognition and active speed limit assist',
      ],
      'Parking': [
        'Parking Assistant Plus with 360° camera',
        'Active park distance control',
      ],
      'Powertrain & Charging': [
        'Two motors, xDrive all-wheel drive, 402 hp',
        'Adaptive two-axle air suspension',
        'Up to 175 kW DC: 10–80% in about 34 min',
      ],
      'Infotainment & Connectivity': [
        'BMW Curved Display: 12.3-inch driver display and 14.9-inch touchscreen',
        'iDrive 8.5',
        'Wireless Apple CarPlay and Android Auto',
        '18-speaker Harman Kardon surround sound',
        'My BMW app',
      ],
      'Seats & Interior': [
        'Hexagonal steering wheel',
        'Floating centre console with CraftedClarity glass controls',
        'Ambient lighting',
      ],
      'Comfort & Convenience': [
        'Four-zone automatic climate control',
        'Comfort access and Digital Key Plus',
        'Wireless phone charging',
      ],
      'Exterior & Lighting': [
        'Sky Lounge panoramic glass roof',
        'Slim adaptive LED headlights',
        'Iconic Glow illuminated kidney grille with self-healing coating',
        'Flush door handles',
        '21-inch aerodynamic wheels',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-ix', 'https://paultan.org/2025/07/21/2025-bmw-ix-facelift-launched-in-malaysia'],
    checked: '2026-11-02',
  },
  'bmw-i7': {
    trim: '50 xDrive',
    groups: {
      'Driver Assistance (ADAS)': [
        'Driving Assistant',
        'Lane departure warning',
      ],
      'Parking': [
        'Reversing camera',
        'Parking Assistant',
      ],
      'Powertrain & Charging': [
        'Adaptive two-axle air suspension',
        'Integral active steering (rear-wheel steering)',
      ],
      'Infotainment & Connectivity': [
        'BMW Curved Display: 12.3-inch driver display and 14.9-inch touchscreen',
        '31.3-inch rear BMW Theatre Screen and rear-door touchscreens',
        'Bowers & Wilkins surround sound',
        'Wireless Apple CarPlay and Android Auto',
        'Remote software upgrades',
      ],
      'Seats & Interior': [
        'BMW Interaction Bar',
        'Veganza upholstery with fine-wood trim',
        'Heated front seats and heated steering wheel',
      ],
      'Comfort & Convenience': [
        'Automatic, soft-close doors',
        'Four-zone automatic climate control',
        'Comfort access and Digital Key Plus',
        'Wireless phone charging',
      ],
      'Exterior & Lighting': [
        'Sky Lounge panoramic roof with LED light graphics',
        'Iconic Glow illuminated kidney grille',
        'Swarovski crystal headlights',
        '20-inch M aerodynamic wheels',
      ],
    },
    sources: ['https://paknev.com/cars/bmw-i7', 'https://www.pakwheels.com/blog/dewan-motors-bmw-i7-special-prices-bev-range/'],
    checked: '2026-11-02',
  },

  // Changan and Deepal, from Master Changan's Pakistan brochures (the L07 and
  // S07 spec tables are images, read from the rendered pages). The Lumin is
  // not launched, so its list is PakNEV's for the expected Pakistan car.
  'deepal-l07': {
    trim: 'Standard',
    groups: {
      'Safety': [
        'Six airbags: front, front side and side curtain',
        'ABS, EBD, brake assist, stability and traction control',
        'Hill hold control',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Auto door unlock after a collision',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with stop & go',
        'Front collision warning and automatic emergency braking',
        'Lane keep assist, lane departure warning and traffic jam assist',
        'Blind spot detection and lane change assist',
        'Rear collision warning, rear cross traffic alert and braking',
        'Door open warning and automatic high beam',
      ],
      'Parking': [
        '360° camera with transparent-chassis view',
        'Front (2) and rear (4) parking sensors',
        'Built-in drive video recorder',
      ],
      'Powertrain & Charging': [
        '190 kW (258 PS) rear motor, 66.8 kWh NMC battery',
        'DC fast charging: 30–80% in 35 minutes',
        'Vehicle-to-load (V2L)',
        'Eco, Comfort, Sport and Custom drive modes',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch rotating touchscreen and 10.2-inch driver display',
        'Head-up display with AR navigation',
        '14 speakers, including driver headrest speakers',
        'Wireless Apple CarPlay and Bluetooth',
        'Voice control (English) and gesture recognition',
      ],
      'Seats & Interior': [
        'Perforated synthetic-leather seats',
        '8-way powered driver seat with lumbar support and memory',
        'Ventilated front seats',
        'Multi-colour dynamic ambient lighting',
        '60:40 folding rear seat',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear touch controls and PM2.5 filter',
        '40 W wireless charger',
        'Digital key and smart key',
        'Windows close automatically when it rains',
        'Power fastback tailgate and front trunk',
      ],
      'Exterior & Lighting': [
        'Heat-resistant panoramic glass roof',
        'LED headlights and star-flame through-type taillights',
        'Frameless doors and hidden electric door handles',
        'Heated, memory, auto-folding door mirrors',
        '19-inch alloy wheels',
      ],
    },
    sources: ['https://deepal.com.pk/upload/L7-Brochure.pdf', 'https://deepal.com.pk/l7'],
    checked: '2026-11-02',
  },
  'deepal-s07': {
    trim: 'Standard',
    groups: {
      'Safety': [
        'Six airbags: front, front side and side curtain',
        'ABS, EBD, brake assist, stability and traction control',
        'Hill hold and hill descent control',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Auto door unlock after a collision',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with stop & go',
        'Front collision warning and automatic emergency braking',
        'Lane keep assist, lane departure warning and traffic jam assist',
        'Blind spot detection and lane change assist',
        'Rear collision warning, rear cross traffic alert and braking',
        'Driver fatigue monitoring',
        'Door open warning and automatic high beam',
      ],
      'Parking': [
        '360° camera with transparent-chassis view',
        'Front (2) and rear (4) parking sensors',
        'Built-in drive video recorder',
      ],
      'Powertrain & Charging': [
        '190 kW (258 PS) rear motor, 66.8 kWh NMC battery',
        'DC fast charging: 30–80% in 35 minutes',
        'Vehicle-to-load (V2L)',
        'Eco, Comfort, Sport and Custom drive modes',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch rotating touchscreen',
        'Head-up display with AR navigation',
        '14 speakers, including driver headrest speakers',
        'Wireless Apple CarPlay and Bluetooth',
        'Voice control (English) and gesture recognition',
      ],
      'Seats & Interior': [
        'Perforated synthetic-leather seats',
        '6-way powered driver seat with lumbar support and memory',
        'Ventilated front seats',
        'Multi-colour dynamic ambient lighting',
        '60:40 folding rear seat',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear touch controls',
        'PM2.5 filter, PM2.5 monitor and ion air purifier',
        '40 W wireless charger',
        'Digital key and smart key',
        'Power tailgate and front trunk',
      ],
      'Exterior & Lighting': [
        'Panoramic glass roof with electric sunshade',
        'LED headlights and star-flame through-type taillights',
        'Frameless doors and hidden electric door handles',
        'Double-glazed front windows',
        '20-inch alloy wheels',
      ],
    },
    sources: ['https://deepal.com.pk/upload/s7-Brochure.pdf', 'https://deepal.com.pk/s7'],
    checked: '2026-11-02',
  },
  'deepal-e07': {
    trim: 'Performance AWD',
    groups: {
      'Safety': [
        'Front, front side, rear side and side curtain airbags',
        'ABS, EBD, brake assist, stability and traction control',
        'Hill hold, hill descent and rollover mitigation',
        'Sentry mode and tyre pressure monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with lane-centring and traffic jam assist',
        'Automatic emergency braking, front collision warning',
        'Front and rear cross traffic alert and braking',
        'Blind spot detection, lane change assist and safe exit warning',
        'Driver-directed lane change and traffic sign recognition',
        'Driver fatigue monitoring',
      ],
      'Parking': [
        'Automatic parking and remote parking assist',
        'Remote straight in and out parking',
        '360° camera with transparent-chassis view and video recorder',
        '12 ultrasonic parking sensors',
      ],
      'Powertrain & Charging': [
        'Dual motors, 590 hp, 0–100 km/h in 3.96 s',
        'Up to 240 kW DC: 30–80% in 15 minutes',
        'Vehicle-to-load (V2L) up to 6.6 kW',
        'Air suspension with continuous damping control',
      ],
      'Infotainment & Connectivity': [
        '15.4-inch multi-angle swivelling touchscreen',
        'AR head-up display',
        '18 speakers',
        'Inside and outside voice control',
      ],
      'Seats & Interior': [
        'Zero-gravity front seats with memory and leg rests',
        'Ventilated front and rear seats',
        '256-colour ambient lighting',
        'Front and rear camping (bed) modes',
      ],
      'Comfort & Convenience': [
        'Electric partition panel and partition glass',
        'Dual-zone climate control with plasma air purifier',
        '50 W wireless charger, digital key and NFC card key',
        '220 V power outlet',
      ],
      'Exterior & Lighting': [
        'Opening electric trunk-glass roof and anti-UV panoramic roof',
        'Electric tailgate and rear window',
        'Star-ring LED headlights and taillights',
        'Hidden electric door handles and front trunk',
        '21-inch alloy wheels',
      ],
    },
    sources: ['https://deepal.com.pk/upload/e07-brochure.pdf', 'https://deepal.com.pk/e7'],
    checked: '2026-11-02',
  },
  'deepal-s05-reev': {
    trim: 'REEV',
    groups: {
      'Safety': [
        'Six airbags: front, front side and side curtain',
        'ABS, EBD, brake assist, stability and traction control',
        'Hill hold, hill descent and rollover mitigation',
        'Sentry mode and tyre pressure monitoring',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS: adaptive cruise control and traffic jam assist',
        'Automatic emergency braking and forward collision warning',
        'Lane keeping, emergency lane keeping and lane departure warning',
        'Blind spot detection, lane change assist and safe exit warning',
        'Rear cross traffic alert and braking',
        'Traffic sign recognition and driver fatigue monitoring',
      ],
      'Parking': [
        '360° camera with transparent-chassis view and video recorder',
        'Remote straight in and out parking',
        'Front (2) and rear (4) parking sensors',
      ],
      'Powertrain & Charging': [
        'Range extender: 1.5-litre engine charges the battery, 1,000+ km combined',
        'DC fast charging: 30–80% in 20 minutes',
        'Vehicle-to-load up to 6.6 kW',
        'Electric-priority, hybrid, fuel-priority and pure-electric modes',
      ],
      'Infotainment & Connectivity': [
        '15.4-inch Sunflower touchscreen',
        'AR head-up display',
        '14 speakers plus outside speakers',
        'Wireless Apple CarPlay and Android Auto',
        'Over-the-air updates and English voice control',
      ],
      'Seats & Interior': [
        'Zero-gravity front passenger seat',
        'Heated and ventilated front seats with memory',
        '64-colour ambient lighting',
        '60:40 folding rear seat',
      ],
      'Comfort & Convenience': [
        'Four-zone automatic climate control with PM2.5 filter',
        'Cool box',
        '50 W wireless charger',
        'Power tailgate with anti-pinch',
      ],
      'Exterior & Lighting': [
        '1.9 m² panoramic glass roof with electric sunshade',
        'Frameless doors and hidden electric door handles',
        'LED headlights and through-type taillights',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://deepal.com.pk/upload/s05-brochure.pdf', 'https://deepal.com.pk/s5'],
    checked: '2026-11-02',
  },
  'changan-nevo-hunter': {
    trim: 'REEV PLUS 4X4',
    groups: {
      'Safety': [
        'Front, front side and side curtain airbags',
        'ABS, EBD, brake assist, stability and traction control',
        'Active yaw control',
        'Hill hold and hill descent control',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Cruise control',
        'Lane departure warning',
      ],
      'Parking': [
        '3D around-view camera with drive video recorder',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Range extender: 2.0-litre turbo generator, 900+ km combined',
        'Dual motors and 4x4, 322 hp and 529 Nm',
        'DC fast charging: 30–80% in 30 minutes',
        'Vehicle-to-load (3.3 kW)',
        'Power-boost mode',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen and 7.5-inch instrument cluster',
        'Wireless Apple CarPlay and Android Auto',
        'English voice control',
      ],
      'Seats & Interior': [
        'Perforated synthetic-leather seats',
        '6-way powered driver seat and 4-way powered passenger seat',
        'Ventilated front seats',
      ],
      'Comfort & Convenience': [
        'Automatic climate control with rear AC vents',
        '40 W wireless charger',
        'Smart key',
      ],
      'Exterior & Lighting': [
        'LED headlights with follow-me-home',
        'Front and rear fog lights',
        'Bedliner, tailgate assist, rear step and side steps',
        '1,010 kg payload and 2,500 kg towing',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://changan.com.pk/upload/Hunter-REEV-Brochure.pdf', 'https://changan.com.pk/hunter'],
    checked: '2026-11-02',
  },
  'changan-lumin': {
    trim: 'Expected Pakistan specification',
    groups: {
      'Safety': [
        'Two airbags',
        'ABS, EBD, stability and traction control',
        'Hill start assist',
      ],
      'Parking': [
        'Reversing camera and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Regenerative braking',
        'Eco and Sport driving modes',
        'DC fast-charging port (L DC version)',
        'Battery pre-heating',
      ],
      'Infotainment & Connectivity': [
        '10.25-inch touchscreen',
        'Digital instrument cluster',
        'Bluetooth',
      ],
      'Seats & Interior': [
        'Four seats with folding rear seats',
        'Fabric upholstery',
      ],
      'Comfort & Convenience': [
        'Keyless entry with push-button start',
        'Manual air conditioning',
        'Power windows',
      ],
      'Exterior & Lighting': [
        'LED daytime running lights',
        'Three-door city-car body',
      ],
    },
    sources: ['https://paknev.com/cars/changan-lumin'],
    checked: '2026-11-02',
  },

  // Chery, from Chery Master Pakistan's brochures (the Tiggo 9's spec pages are
  // images, read from the rendered pages) and its Tiggo 8 training deck, with
  // PakNEV for the Chery Q. The Tiggo Cross is not sold here and has none.
  'chery-tiggo-7-phev': {
    trim: 'Premium (FWD)',
    groups: {
      'Safety': [
        'Eight airbags, including a driver knee and a centre airbag',
        'ABS, EBD, brake assist, stability control, hill hold and hill descent',
        'Tyre pressure monitoring (TPMS)',
        'Multi-collision braking',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS: adaptive cruise control with integrated cruise assist',
        'Automatic emergency braking and forward collision warning',
        'Lane departure warning and prevention, lane change assist',
        'Blind spot detection, rear collision warning and door opening warning',
        'Rear cross traffic alert and braking',
        'Traffic jam assist and driver monitoring',
      ],
      'Parking': [
        '540° camera with transparent-chassis view',
        'Front and rear parking radar',
      ],
      'Powertrain & Charging': [
        'Fifth-generation Super Hybrid: 1.5 TGDI with dedicated hybrid transmission',
        '342 hp and 525 Nm, 90+ km on electricity, 1,200+ km combined',
        '40 kW DC charging; 7 kW wallbox and portable charger supplied',
        'Vehicle-to-load (3.3 kW)',
        'Eco, Normal and Sport modes',
      ],
      'Infotainment & Connectivity': [
        '24.6-inch dual curved display (12.3 + 12.3 inches)',
        'Snapdragon 8155 chip and smart voice assistant',
        'Apple CarPlay and Android Auto',
        '8-speaker Sony sound system',
        'Chery mobile app',
      ],
      'Seats & Interior': [
        'Faux-leather seats',
        'Heated and ventilated front seats',
        '6-way electric driver seat with memory and 4-way electric passenger seat',
        '64-colour ambient lighting',
        '60:40 split rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with N95 filter and rear vents',
        '50 W wireless charger',
        'Hands-free power tailgate',
        'Heated and cooled front armrest',
        'Qibla compass',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof with shade',
        'Infinity tail lamps',
        'Heated, auto-folding mirrors with memory',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://cache3.pakwheels.com/system/brochures/1492/original/Chery_%28Tiggo-7%29_Brochure_AW-01-YQ_%281%29_compressed.pdf?1775896949'],
    checked: '2026-11-02',
  },
  'chery-tiggo-8-phev': {
    trim: 'Premium (AWD)',
    groups: {
      'Safety': [
        'Ten airbags',
        'ISOFIX child-seat anchors',
        'Tyre pressure monitoring (TPMS)',
        'IP68-rated battery pack with fast high-voltage cut-off',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS with 19 functions',
        'Adaptive cruise control and traffic jam assist',
        'Automatic emergency braking',
        'Lane departure warning and prevention',
        'Blind spot monitoring',
        'Driver monitoring system',
      ],
      'Parking': [
        '540° camera',
        'Reversing camera with rear radar',
      ],
      'Powertrain & Charging': [
        'Super Hybrid with all-wheel drive, 496 hp and 735 Nm',
        '90 km on electricity (WLTC), 1,200+ km combined',
        'DC fast charging: 30–80% in 20 minutes',
        'Vehicle-to-load (3.3 kW)',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch 2.5K touchscreen with Snapdragon 8155 chip',
        'Windscreen head-up display (W-HUD)',
        '12 Sony speakers with headrest speakers',
        'Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Seven seats (5+2)',
        'Heated, ventilated and massaging electric front seats',
        '64-colour ambient lighting',
        'Leather multi-function steering wheel',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with rear AC',
        '50 W ventilated wireless charger',
        'Power tailgate',
      ],
      'Exterior & Lighting': [
        'Voice-controlled panoramic sunroof',
        'Matrix LED headlights',
        'Concealed door handles and metal roof rails',
        'Rain-sensing wipers',
        '19-inch alloy wheels',
      ],
    },
    sources: ['https://cache2.pakwheels.com/system/brochures/1463/original/Tiggo_8_MAE_Trainning_Deck_V1.pdf?1768390706', 'https://paknev.com/cars/chery-tiggo-8-phev'],
    checked: '2026-11-02',
  },
  'chery-tiggo-9-phev': {
    trim: 'Premium (AWD)',
    groups: {
      'Safety': [
        'Front, front side, curtain, second-row side, knee and far-side airbags',
        'ABS, EBD, brake assist, stability and traction control, hill hold and hill descent',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with integrated cruise assist',
        'Automatic emergency braking and forward collision warning',
        'Lane departure warning and prevention, lane change assist',
        'Blind spot detection, rear collision warning and door opening warning',
        'Rear cross traffic alert and traffic jam assist',
        'Driver monitoring and intelligent high beam',
      ],
      'Parking': [
        'Automatic parking assist',
        '540° camera with transparent-chassis view',
        'Front, rear and side radar',
      ],
      'Powertrain & Charging': [
        'Three motors and all-wheel drive: 610 hp and 920 Nm, 0–100 km/h in 5.4 s',
        '170 km on electricity and up to 1,400 km combined (NEDC)',
        'DC charging up to 71 kW (CCS2)',
        'Vehicle-to-load (6.6 kW)',
        'Six drive modes: Eco, Normal, Sport, Snow, Sand and Off-road',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch touchscreen and 10.25-inch instrument display',
        'W-HUD head-up display',
        '14 Sony speakers, including headrest speakers',
        'Apple CarPlay and Android Auto',
        'Snapdragon 8155 chip and smart voice assistant',
      ],
      'Seats & Interior': [
        'Leather seats for seven',
        'Heated, ventilated and massaging front seats with memory',
        'Heated and ventilated second-row seats',
        'Heated steering wheel with electric adjustment',
        '64-colour ambient lighting and second-row privacy curtains',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with second-row controls and independent third-row AC',
        'PM0.3 filter and negative-ion air purifier',
        '50 W ventilated wireless charger',
        'Hands-free power tailgate',
        'Trailer hook and Qibla compass',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof with full electric shade',
        'LED headlights and taillights with dynamic turn signals',
        'Heated, auto-folding mirrors with memory',
        '20-inch alloy wheels',
      ],
    },
    sources: ['https://cache4.pakwheels.com/system/brochures/1474/original/Chery_T9_Brochure-Final_Single_page.pdf?1770896912'],
    checked: '2026-11-02',
  },
  'chery-q': {
    trim: 'Premium',
    groups: {
      'Safety': [
        'Six airbags',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Lane keep assist',
        'Blind spot monitoring',
        'Forward collision warning',
        'Rear cross traffic alert',
      ],
      'Parking': [
        'Automatic parking assist',
        '540° camera',
      ],
      'Powertrain & Charging': [
        '42.7 kWh LFP battery, 400 km (NEDC)',
        'DC fast charging: 30–80% in about 17 minutes',
        'Vehicle-to-load (6.6 kW)',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch touchscreen and 8.8-inch digital cluster',
        'Apple CarPlay and Android Auto',
        'Six-speaker audio',
      ],
      'Seats & Interior': [
        '6-way powered driver seat',
      ],
      'Comfort & Convenience': [
        '50 W wireless charger',
        'Power tailgate',
        'Electric front trunk',
      ],
      'Exterior & Lighting': [
        'LED daytime running lights',
        '17-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/chery-q'],
    checked: '2026-11-02',
  },
}

// The two Cyberster trims share one equipment list; only the drivetrain
// differs, and that is in the spec sheet.
CAR_FEATURES['mg-cyberster-gt-dual'] = CAR_FEATURES['mg-cyberster']!


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
