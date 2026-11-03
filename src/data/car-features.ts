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
    trim: 'Dynamic, with Premium additions marked (the row now covers both Pakistan trims)',
    groups: {
      'Safety': [
        'Front, side (front and rear), curtain and driver far-side airbags',
        'Dual-stage front seat-belt pretensioners',
        'Rear seat-belt pretensioners',
        'Front and rear seat-belt reminders',
        'Traction control (TCS)',
        'Electronic brake-force distribution (EBD)',
        'Hill hold control',
        'Electric parking brake with auto-hold',
        'Intelligent power brake system',
        'ISOFIX child-seat anchors',
        'Cell-to-Body (CTB) battery structure',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control (ACC)',
        'Automatic emergency braking (AEB)',
        'Predictive collision warning (PCW)',
        'Lane departure warning and prevention (LDW/LDP)',
        'Emergency lane keeping assist (ELKA)',
        'Blind spot detection (BSD)',
        'Door open warning (DOW)',
        'Front cross-traffic alert and brake (FCTA/FCTB)',
        'Rear cross-traffic alert and brake (RCTA/RCTB)',
        'Traffic sign recognition (TSR)',
        'Intelligent speed limit information and control (ISLI/ISLC)',
        'High beam assist (HMA)',
        'Driver attention warning (DAW)',
        'Premium: windscreen head-up display (W-HUD)',
      ],
      'Parking': [
        '360° camera',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Rear-wheel drive on both trims',
        'Dynamic: 61.44 kWh Blade battery, 150 kW / 310 Nm motor',
        'Premium: 82.56 kWh Blade battery, 230 kW / 360 Nm motor',
        'CCS2 DC fast charging: 110 kW (Dynamic), 150 kW (Premium)',
        'Type 2 AC charging at 7 kW',
        'Portable Mode 2 charging cable',
        'Vehicle-to-load (V2L)',
        'Double-wishbone front / multi-link rear suspension',
        'Ventilated disc brakes with floating calipers',
        'Premium: ventilated and drilled discs with fixed front calipers',
        'Premium: frequency-selective (FSD) dampers',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch rotating touchscreen',
        '10.25-inch digital instrument cluster',
        '12-speaker sound system',
        'Voice assistant',
        'Bluetooth phone and audio streaming',
        'USB-C and USB-A ports front and rear',
      ],
      'Seats & Interior': [
        'Faux-leather seats',
        'Premium: leather seats',
        '8-way power driver seat',
        'Premium: 4-way power lumbar for the driver',
        'Premium: driver-seat memory with easy-entry function',
        '6-way power passenger seat',
        'Heated and ventilated front seats',
        '60/40 split-folding rear seat',
        'Ambient lighting',
        'Crystal gear selector',
      ],
      'Comfort & Convenience': [
        'Digital key and NFC card key',
        'Dual wireless phone chargers',
        'Dual-zone climate control with rear vents',
        'Air ioniser with CN95 PM2.5 filter',
        'Rain-sensing frameless wipers',
        'Silver-plated panoramic glass roof',
        'Acoustic glass',
        'Power tailgate',
        '50 L front trunk and 400 L rear boot',
        'Tyre repair kit and toolkit',
      ],
      'Exterior & Lighting': [
        'LED headlights and tail lights',
        'Sequential rear indicators',
        'Flush door handles',
        'Heated, power-adjustable, power-folding mirrors',
        'Premium: mirrors with memory and reverse auto-tilt',
        '18-inch alloys (225/50 R18) on the Dynamic',
        'Premium: 19-inch alloys (235/45 R19)',
        'Premium: Atlantis Grey paint option',
      ],
    },
    sources: ['https://byd-mega.com/api/v1/image/spec-sheets/BYD-Seal-Spec-Sheet.pdf', 'https://byd-mega.com/vehicles/seal', 'https://cache3.pakwheels.com/system/brochures/280/original/SEAL-BROCHURE.pdf?1746435676'],
    checked: '2026-11-02',
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

  // DFSK / Seres, from Gari.pk's Pakistan listing, keeping items PakWheels'
  // spec table also shows. PakNEV has no Seres 3 page, and Regal Automobiles
  // publishes no brochure online.
  'dfsk-seres-3': {
    groups: {
      'Safety': [
        'Six airbags',
        'ABS with EBD, brake assist, stability and traction control',
        'Hill start assist, hill descent control and auto hold',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Electronic parking brake',
      ],
      'Driver Assistance (ADAS)': [
        'Lane departure warning',
        'Forward collision warning',
      ],
      'Parking': [
        '360° camera',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        '54 kWh battery, 403 km (NEDC)',
        'CCS2 DC fast charging: 20–80% in about 30 minutes',
        'Standard, Comfort and Sport modes with regenerative braking',
        '22 kW wall charger included at launch',
      ],
      'Infotainment & Connectivity': [
        '10.25-inch HD touchscreen with navigation',
        'Digital instrument cluster',
        'Wireless smartphone connectivity and Bluetooth',
        'Six speakers',
      ],
      'Seats & Interior': [
        'Leather seats',
        '6-way electric, heated front seats',
        'Multifunction steering wheel',
      ],
      'Comfort & Convenience': [
        'Automatic climate control',
        'Keyless entry and push-button start',
        'Wireless phone charger',
        'Electric tailgate with foot sensor',
      ],
      'Exterior & Lighting': [
        'Electric panoramic sunroof',
        'Automatic LED headlights with daytime running lights',
        'LED taillights',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://www.gari.pk/new-cars/seres/3/', 'https://www.pakwheels.com/new-cars/seres/3--2/specifications/'],
    checked: '2026-11-02',
  },

  // Dongfeng, from PakNEV's per-trim lists (base trim first, then what the top
  // trim adds), and Forthing from Capital Smart Motors' Friday brochure.
  'dongfeng-007': {
    trim: 'Essence (Prestige and Excellence additions marked)',
    groups: {
      'Safety': [
        'Electronic stability control',
        'Tyre pressure monitoring (TPMS)',
      ],
      'Driver Assistance (ADAS)': [
        'Forward collision warning and automatic emergency braking',
        'Lane keep assist and traffic sign recognition',
        'Cruise control (adaptive on upper trims)',
        'Upper trims: Level 2+ suite with blind spot monitoring, rear cross traffic alert and door open warning',
      ],
      'Parking': [
        'Reversing camera and rear parking sensors',
        'Upper trims: 360° camera and remote parking assistant',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch touchscreen and 8-inch driver display',
        'Android Auto (wireless Apple CarPlay on upper trims)',
        'Six speakers (19-speaker Wanos system with headrest speakers on upper trims)',
      ],
      'Seats & Interior': [
        'Synthetic leather seats',
        'Upper trims: power, heated and ventilated front seats with memory',
        'Upper trims: multi-colour interactive ambient lighting and heated steering wheel',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'Wireless phone charging',
        'Upper trims: dual-zone automatic climate control',
      ],
      'Exterior & Lighting': [
        'Fixed panoramic glass roof',
        'Frameless doors and pop-out door handles',
        'LED daytime running lights and LED rear light bar',
        '18-inch alloy wheels (19-inch on upper trims)',
        'Excellence: electric scissor front doors and active rear wing',
      ],
    },
    sources: ['https://paknev.com/cars/dongfeng-007'],
    checked: '2026-11-02',
  },
  'dongfeng-box': {
    trim: 'Base trims (Flagship additions marked)',
    groups: {
      'Safety': [
        'Dual front airbags',
        'ABS, stability and traction control',
        'Tyre pressure monitoring (TPMS)',
      ],
      'Driver Assistance (ADAS)': [
        'Cruise control',
        'Flagship: Level 2 ADAS with adaptive cruise, AEB, lane departure warning and lane keep assist',
      ],
      'Parking': [
        'Flagship: 540° camera with transparent-chassis view and auto parking',
        'Flagship: front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Comfort, Eco and Sport drive modes',
        'CCS2 DC fast charging (430 trims)',
      ],
      'Infotainment & Connectivity': [
        '12.8-inch touchscreen and 5-inch driver display',
        'Four speakers (six on the Flagship)',
      ],
      'Seats & Interior': [
        'Faux-leather upholstery',
        '32-colour ambient lighting',
        'Upper trims: electric, heated and ventilated driver seat; flat-reclining front seats',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'Wireless phone charging',
        'Electronic parking brake with auto hold',
      ],
      'Exterior & Lighting': [
        'LED headlights (follow-me-home on upper trims)',
        'Frameless doors and hidden door handles',
        'Heated, folding door mirrors',
        '16-inch wheels (17-inch alloys on the Flagship) and two-tone paint',
      ],
    },
    sources: ['https://paknev.com/cars/dongfeng-box'],
    checked: '2026-11-02',
  },
  'dongfeng-vigo': {
    trim: 'E1 Dynamic (E2 additions marked)',
    groups: {
      'Safety': [
        'Four airbags (six on E2 trims)',
        'ABS, EBD, stability and traction control',
        'Hill start assist',
      ],
      'Driver Assistance (ADAS)': [
        'E2 trims: Level 2 ADAS suite',
      ],
      'Parking': [
        'Reversing camera',
        'E2 trims: 540° camera and front parking sensors',
      ],
      'Powertrain & Charging': [
        'CCS2 DC fast charging, 60 kW',
        'E2 trims: vehicle-to-load (V2L)',
      ],
      'Infotainment & Connectivity': [
        '12.8-inch touchscreen and 8.8-inch digital cluster',
        'Bluetooth',
        'Four speakers (six on E2 trims)',
      ],
      'Seats & Interior': [
        'Fabric seats on the E1',
        'E2 trims: 6-way power, heated and ventilated front seats with memory and welcome function',
        'E2 trims: multi-colour ambient lighting and rear armrest',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'E2 trims: 50 W wireless charger',
      ],
      'Exterior & Lighting': [
        'Roof rails and black roof spoiler',
        'E2 trims: panoramic sunroof, LED headlights with follow-me-home and hidden power door handles',
        '17-inch wheels (two-tone alloys on E2 trims)',
      ],
    },
    sources: ['https://paknev.com/cars/dongfeng-vigo'],
    checked: '2026-11-02',
  },
  'forthing-friday-bev': {
    trim: 'Luxury and Exclusive (Exclusive adds the driver aids)',
    groups: {
      'Safety': [
        'Six airbags: front, front side and front and rear curtain',
        'ABS, EBD, brake assist, stability and traction control, hill start assist',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Automatic unlocking after a collision',
      ],
      'Driver Assistance (ADAS)': [
        'Exclusive: adaptive cruise control and traffic jam assist',
        'Exclusive: forward collision warning and automatic emergency braking',
        'Exclusive: lane departure warning, lane keep assist and lane change assist',
        'Exclusive: blind spot monitoring, rear cross traffic alert and door open warning',
        'Intelligent high beam control',
      ],
      'Parking': [
        'Automatic parking assist',
        'Exclusive: 360° camera and front parking radar',
      ],
      'Powertrain & Charging': [
        'CCS2 DC fast charging: 30–80% in 30 minutes',
        '3.3 kW portable AC charger and camping mode',
        'Eco, Standard and Sport drive modes',
      ],
      'Infotainment & Connectivity': [
        'Dual HD screens: touchscreen and digital cluster',
        'Surround sound system',
      ],
      'Seats & Interior': [
        'Leather seats with ventilation (premium materials on the Exclusive)',
        'Split-folding rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Wireless charging and multiple USB ports',
        'Smart key with keyless entry and push-button start',
      ],
      'Exterior & Lighting': [
        'Electric panoramic sunroof',
        'LED matrix headlights and tail lamps',
        '19-inch alloy wheels with a full-size spare',
      ],
    },
    sources: ['https://cache4.pakwheels.com/system/brochures/1476/original/Forthing_Friday_REEV-Brochure_compressed.pdf', 'https://paknev.com/cars/forthing-friday-bev'],
    checked: '2026-11-02',
  },
  'forthing-friday-reev': {
    trim: 'Exclusive',
    groups: {
      'Safety': [
        'Six airbags: front, front side and front and rear curtain',
        'ABS, EBD, brake assist, stability and traction control, hill start assist',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Automatic unlocking after a collision',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and traffic jam assist',
        'Forward collision warning and automatic emergency braking',
        'Lane departure warning, lane keep assist and lane change assist',
        'Blind spot monitoring, rear cross traffic alert and door open warning',
        'Intelligent high beam control',
      ],
      'Parking': [
        '360° camera',
        'Automatic parking assist and front and rear parking radar',
      ],
      'Powertrain & Charging': [
        'Range extender: 1.5-litre engine generates power, 1,150 km combined (CLTC)',
        'CCS2 DC fast charging: 30–80% in 30 minutes',
        '3.3 kW portable AC charger and camping mode',
        'Eco, Standard and Sport drive modes',
      ],
      'Infotainment & Connectivity': [
        'Dual HD screens: touchscreen and digital cluster',
        'Surround sound system',
      ],
      'Seats & Interior': [
        'Leather seats with ventilation',
        'Split-folding rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Wireless charging and multiple USB ports',
        'Smart key with keyless entry and push-button start',
      ],
      'Exterior & Lighting': [
        'Electric panoramic sunroof',
        'LED matrix headlights and tail lamps',
        '19-inch alloy wheels with a full-size spare',
      ],
    },
    sources: ['https://cache4.pakwheels.com/system/brochures/1476/original/Forthing_Friday_REEV-Brochure_compressed.pdf', 'https://paknev.com/cars/forthing-friday-reev'],
    checked: '2026-11-02',
  },

  // GUGO, from GUGO Motors' GiGi brochure, PakNEV's Box lists and PakWheels'
  // AION V and UT pages (GUGO's own imports, not LMC's official GAC cars).
  'gugo-gigi': {
    trim: '220',
    groups: {
      'Safety': [
        'Driver airbag',
        'ABS with EBD, electronic stability control and traction control',
        'Brake assist and auto hold',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
        'Power cut-off in a collision',
      ],
      'Parking': [
        'Reversing camera',
        'Rear parking radar',
      ],
      'Powertrain & Charging': [
        '16.8 kWh LFP battery, 220 km (NEDC)',
        '3.3 kW home charging in 4–5 hours',
        'Economy and Sport modes with regenerative braking',
        'Optional 5 kW solar charging parking shed',
      ],
      'Infotainment & Connectivity': [
        '8.8-inch touchscreen',
        '7-inch digital instrument cluster',
        'Two speakers',
      ],
      'Seats & Interior': [
        'Four seats',
        '50:50 folding rear seats for extra load space',
        'Multi-function steering wheel',
      ],
      'Comfort & Convenience': [
        'Keyless entry and push-button start',
        'Cruise control and speed limiter',
        'Automatic climate control (cooling and heating)',
        'Remote central locking',
      ],
      'Exterior & Lighting': [
        'LED daytime running lights',
        'Electrically adjustable mirrors',
        '13-inch alloy wheels',
      ],
    },
    sources: ['https://gugomotors.com/pdf/dfsk-gigi-mini.pdf'],
    checked: '2026-11-02',
  },
  'gugo-box': {
    trim: 'E1 Eco (E3 Premium additions marked)',
    groups: {
      'Safety': [
        'Dual front airbags',
        'ABS, EBD, brake assist, stability and traction control',
        'Hill start assist and auto hold',
        'Tyre pressure monitoring (TPMS)',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'E3: forward collision warning and lane keep assist',
        'E3: active electronic braking',
      ],
      'Parking': [
        'Reversing camera and rear parking sensors',
        'E3: 360° camera',
      ],
      'Powertrain & Charging': [
        'CCS2 DC fast charging: 10–80% in about 30 minutes',
      ],
      'Infotainment & Connectivity': [
        '5-inch digital instrument display',
        'Intelligent voice control and phone app remote control',
        'E2 and E3: 12-inch floating touchscreen with navigation and Bluetooth',
      ],
      'Seats & Interior': [
        'Fabric seats (leatherette on E2 and E3)',
      ],
      'Comfort & Convenience': [
        'Smart keyless entry',
        'Automatic climate control',
        'Anti-pinch power windows',
        'Underfloor cable storage',
      ],
      'Exterior & Lighting': [
        'Frameless doors and hidden door handles',
        'LED taillights (adaptive LED headlights on the E3)',
        '16-inch steel wheels (alloys on E2 and E3)',
      ],
    },
    sources: ['https://paknev.com/cars/gugo-motors-box'],
    checked: '2026-11-02',
  },
  'gugo-aion-v': {
    trim: 'V5 Premium (V6 Luxury additions marked)',
    groups: {
      'Safety': [
        'Six airbags',
      ],
      'Driver Assistance (ADAS)': [
        'Advanced driver-assistance suite',
      ],
      'Parking': [
        '360° camera',
      ],
      'Powertrain & Charging': [
        'LFP battery (GAC Magazine technology)',
        'Fast DC charging up to 150 kW (180 kW on the V6)',
        'Vehicle-to-load (V2L)',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch floating touchscreen and digital instrument cluster',
        'Apple CarPlay and Android Auto',
        'Nine-speaker sound system',
        'In-car Wi-Fi and phone app control',
      ],
      'Seats & Interior': [
        '6-way electric driver seat and 4-way electric passenger seat',
        'Reclining lounge-style seats',
      ],
      'Comfort & Convenience': [
        'Built-in car refrigerator',
        'Rear AC vents and PM2.5 cabin filter',
        'Wireless phone charging',
        'Electric tailgate',
      ],
      'Exterior & Lighting': [
        'V6: panoramic sunroof',
        '19-inch alloy wheels',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/gugo/aion-v/'],
    checked: '2026-11-02',
  },
  'gugo-aion-ut': {
    trim: 'U4 Premium (UT5 Luxury additions marked)',
    groups: {
      'Safety': [
        'Six airbags',
      ],
      'Parking': [
        '360° camera',
      ],
      'Powertrain & Charging': [
        'DC fast charging up to 70 kW (80 kW on the UT5)',
        'Heat-pump climate system',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 8.8-inch digital cluster',
        'Android Auto',
        'GAC app remote control',
      ],
      'Seats & Interior': [
        '6-way adjustable driver seat',
      ],
      'Comfort & Convenience': [
        'Wireless phone charging',
      ],
      'Exterior & Lighting': [
        'UT5: panoramic sunroof',
        '16-inch wheels (17-inch on the UT5)',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/gugo/aion-ut'],
    checked: '2026-11-02',
  },

  // GWM (Haval, Tank, ORA), from PakNEV's lists checked against the highlights
  // on GWM Pakistan's own model pages. The Tank 300 HEV is not sold here and
  // has none.
  'haval-jolion-hev': {
    groups: {
      'Safety': [
        'Six airbags',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 driving assistance with adaptive cruise control and lane centring',
        'Automatic emergency braking and lane keep assist',
        'Blind spot monitoring and rear cross traffic alert',
      ],
      'Parking': [
        '360° camera',
      ],
      'Powertrain & Charging': [
        'Self-charging hybrid with a 2-speed dedicated hybrid transmission',
        'Rotary gear selector',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen and 7-inch instrument cluster',
        'Head-up display',
        'Wireless Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Leather seats',
        '6-way power driver seat and heated front seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Wireless phone charging',
        'Push-button start',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'LED headlights with blue hybrid accents',
        'Rear spoiler and 18-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-haval-jolion-hev', 'https://haval-backend.onrender.com/api/models/haval-jolion'],
    checked: '2026-11-02',
  },
  'haval-h6-hev': {
    groups: {
      'Safety': [
        'Six airbags and a high-strength steel safety cage',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS with intelligent adaptive cruise control and traffic jam assist',
        'Lane keep assist, lane departure warning and lane change assist',
        'Blind spot detection and forward collision mitigation braking',
        'Traffic sign recognition and door-open warning',
      ],
      'Parking': [
        '360° camera with 540° transparent-chassis view',
        'Automatic parking and auto reversing up to 50 metres',
      ],
      'Powertrain & Charging': [
        'Self-charging hybrid, 240 hp and 530 Nm',
        'Electronic rotary gear shifter',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 10.25-inch driver display',
        'Wireless Apple CarPlay and Android Auto',
        'Voice commands',
        '9-speaker audio with subwoofer',
      ],
      'Seats & Interior': [
        'Heated and ventilated zero-gravity front seats',
        'Electric driver seat with memory',
        'Heated steering wheel and leatherette upholstery',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        '50 W wireless charger',
        'Hands-free power tailgate',
        'Smart keyless entry and remote start',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'Full-width LED taillight strip',
        '19-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-haval-h6-hev', 'https://haval-backend.onrender.com/api/models/haval-h6-hev'],
    checked: '2026-11-02',
  },
  'haval-h6-phev': {
    trim: 'Hi4 AWD',
    groups: {
      'Safety': [
        'Six airbags and a high-strength steel safety cage',
        'Stability control and tyre pressure monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS with adaptive cruise control and traffic jam assist',
        'Forward collision warning and automatic emergency braking',
        'Lane departure warning, lane keep assist and blind spot monitoring',
        'Rear cross traffic alert and traffic sign recognition',
      ],
      'Parking': [
        '540° camera',
        'Automatic parking and autonomous reverse',
      ],
      'Powertrain & Charging': [
        'Plug-in hybrid with Hi4 all-wheel drive, 360 hp and 760 Nm',
        'Full EV, EV Priority and Intelligent Hybrid modes',
        'Vehicle-to-load with an emergency AC socket',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 10.25-inch driver display',
        'Windscreen head-up display',
        'Apple CarPlay and Android Auto, smart voice commands',
        '4G connected-car app with remote control',
        '9-speaker audio',
      ],
      'Seats & Interior': [
        '6-way electric driver seat with memory',
        'Leatherette seats and microfibre steering wheel',
      ],
      'Comfort & Convenience': [
        '50 W wireless charger',
        'Inductive power tailgate',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'Automatic LED headlights and rain-sensing wipers',
        'Roof rails and 19-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-haval-h6-phev', 'https://haval-backend.onrender.com/api/models/haval-h6-phev'],
    checked: '2026-11-02',
  },
  'haval-h6-gt-phev': {
    groups: {
      'Safety': [
        'Six to seven airbags (5-star ANCAP rating)',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and traffic jam assist',
        'Forward collision warning and automatic emergency braking',
        'Lane keep assist',
      ],
      'Parking': [
        '540° camera',
        'Fully automatic parking and autonomous reverse',
      ],
      'Powertrain & Charging': [
        'Plug-in hybrid with all-wheel drive, 430 hp and 642 Nm, 0–100 km/h in 4.58 s',
        'DC charging: 30–80% in 26 minutes',
        'Full EV, EV Priority and Intelligent Hybrid modes',
        'Paddle shifters',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen and 10.25-inch driver display',
        'Apple CarPlay and Android Auto',
        '4G connected-car app with remote control',
        '8-speaker audio',
      ],
      'Seats & Interior': [
        'Heated and ventilated seats in grey suede-and-leather',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control',
        'Hands-free power tailgate',
      ],
      'Exterior & Lighting': [
        'Coupé fastback styling',
        'Panoramic sunroof',
        'LED headlights and taillights',
        '19-inch gloss-black alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-haval-h6-gt-phev', 'https://haval-backend.onrender.com/api/models/h6-gt'],
    checked: '2026-11-02',
  },
  'gwm-tank-500-hev': {
    groups: {
      'Safety': [
        'Six airbags',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and off-road cruise control',
        'Downhill assist',
      ],
      'Parking': [
        '540° camera',
        'Automatic parking',
      ],
      'Powertrain & Charging': [
        'Self-charging hybrid with a 9-speed automatic',
        'Hi-4T four-wheel drive with front and rear differential locks',
        'Tank turn assist and multiple terrain modes',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 12.3-inch digital cluster',
        'Head-up display',
        '12-speaker audio',
      ],
      'Seats & Interior': [
        'Seven seats in Nappa leather',
        'Ventilated, memory front seats with massage',
        '64-colour ambient lighting',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'Automatic side steps',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-tank-500-hev', 'https://haval-backend.onrender.com/api/models/tank-500'],
    checked: '2026-11-02',
  },
  'gwm-tank-500-phev': {
    groups: {
      'Safety': [
        'Six airbags',
        'Tyre pressure monitoring (TPMS)',
        'Driver drowsiness detection',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and off-road cruise control',
        'Lane keep assist, lane centring and lane change assist',
        'Automatic emergency braking',
        'Downhill assist',
      ],
      'Parking': [
        '540° camera with clear-chassis view',
        'Automatic parking',
      ],
      'Powertrain & Charging': [
        'Plug-in hybrid with a 9-speed automatic, 402 hp and 750 Nm',
        'Hi-4T four-wheel drive with front and rear differential locks',
        'DC charging: 30–80% in 24 minutes',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 12.3-inch digital cluster',
        'Head-up display',
        'Wireless Apple CarPlay and Android Auto',
        '12-speaker audio, voice commands, 4G app control',
      ],
      'Seats & Interior': [
        'Nappa leather seats',
        'Ventilated, memory massage seats front and rear',
        'Multi-colour ambient lighting',
      ],
      'Comfort & Convenience': [
        '50 W wireless charger',
        'Soft-close tailgate',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-tank-500-phev', 'https://haval-backend.onrender.com/api/models/tank-500-phev'],
    checked: '2026-11-02',
  },
  'gwm-ora-05': {
    groups: {
      'Safety': [
        'Six airbags',
        'Driver monitoring system',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS with adaptive cruise control',
        'Lane keep assist and automatic emergency braking',
      ],
      'Parking': [
        '540° camera',
      ],
      'Powertrain & Charging': [
        '58.33 kWh LFP battery, 435 km (WLTP)',
        'DC fast charging up to 120 kW: 10–80% in about 30 minutes',
        'Vehicle-to-load (V2L)',
        'Heat-pump air conditioning',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch 2K touchscreen and 10.25-inch driver display',
        'Wireless Apple CarPlay and Android Auto',
        '6-speaker DTS sound system',
      ],
      'Seats & Interior': [
        'Heated and ventilated front seats',
        'Driver seat memory',
      ],
      'Comfort & Convenience': [
        '50 W wireless charger',
        'Power tailgate',
      ],
      'Exterior & Lighting': [
        'Panoramic glass roof with electric sunshade',
        'Intelligent LED headlights with automatic dimming',
        '18-inch two-tone alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-ora-05', 'https://haval-backend.onrender.com/api/models/ora-05'],
    checked: '2026-11-02',
  },
  'gwm-ora-07': {
    trim: 'FWD and AWD Performance',
    groups: {
      'Safety': [
        'Six airbags',
        'Stability and traction control',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with lane centring',
        'Lane keep assist, emergency lane keeping and intelligent evasion assist',
        'Blind spot monitoring and rear cross traffic alert',
        'Forward collision warning and automatic emergency braking',
        'Traffic sign recognition, drowsiness monitoring and door open warning',
      ],
      'Parking': [
        '360° camera with transparent-chassis view',
        'Semi-automatic parking and front and rear sensors',
      ],
      'Powertrain & Charging': [
        '83.5 kWh battery: 640 km (FWD) or 550 km (AWD), NEDC',
        'AWD Performance: dual motors, 402 hp, 0–100 km/h in 4.3 s, track mode',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen and 10.25-inch driver display',
        'Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Heated, ventilated and massaging front seats',
        'Power driver (6-way) and passenger (4-way) seats',
        'Multi-colour ambient lighting',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control',
        'Wireless phone charging',
        'Keyless entry and push-button start',
      ],
      'Exterior & Lighting': [
        'Panoramic glass roof',
        'Frameless doors and active grille shutters',
        'LED headlights and daytime running lights',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-ora-07', 'https://haval-backend.onrender.com/api/models/ora-07'],
    checked: '2026-11-02',
  },
  'gwm-ora-03': {
    trim: '400 Pro',
    groups: {
      'Safety': [
        'Six airbags',
        'ABS, stability and traction control, roll-movement intervention',
        'Secondary collision mitigation',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with stop & go',
        'Automatic emergency braking and forward collision warning',
        'Lane keep assist and blind spot monitoring',
        'Door-open warning',
      ],
      'Parking': [
        '360° camera with transparent-chassis view',
        'Rear parking sensors',
      ],
      'Infotainment & Connectivity': [
        'Dual 10.25-inch screens',
        'Hello ORA voice assistant',
        'Wireless Apple CarPlay and Android Auto',
        'Over-the-air updates',
      ],
      'Seats & Interior': [
        'Quilted leatherette seats, heated and ventilated in front',
        '6-way power driver seat',
        'Face recognition',
      ],
      'Comfort & Convenience': [
        'Smart keyless entry and proximity start',
        'Wireless phone charging',
        'Electric sunshade',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'Round LED headlights and light-strip tailgate',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-ora-03'],
    checked: '2026-11-02',
  },
  'haval-jolion-max-ev': {
    trim: 'Expected Pakistan specification',
    groups: {
      'Safety': [
        'Six airbags',
        'Stability and traction control, hill start and hill descent',
        'Driver fatigue monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Automatic emergency braking and forward collision warning',
        'Lane keep assist, lane departure warning and lane change assist',
        'Blind spot monitoring and rear cross traffic alert',
      ],
      'Parking': [
        '360° camera',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch touchscreen and 10.25-inch digital cluster',
        'Head-up display',
        'Wireless Apple CarPlay and Android Auto, voice control',
        'Six speakers',
      ],
      'Seats & Interior': [
        'Power-adjustable, ventilated front seats',
        'Ambient lighting',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with PM2.5 purifier',
        'Wireless phone charging',
        'Electric smart tailgate',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'Matrix LED headlights',
        '18-inch alloy wheels and aluminium roof rails',
      ],
    },
    sources: ['https://paknev.com/cars/gwm-haval-jolion-max-ev'],
    checked: '2026-11-02',
  },
  'honda-hr-v-ehev': {
    trim: 'e:HEV (single trim)',
    groups: {
      'Safety': [
        'Six airbags',
        'ABS with EBD, stability control and traction control',
        'Hill start assist and hill descent control',
        'Rear seat reminder and seatbelt reminders for all seats',
      ],
      'Driver Assistance (ADAS)': [
        'Honda Sensing: collision mitigation braking',
        'Adaptive cruise control with low-speed follow',
        'Lane keep assist and road departure mitigation',
        'Auto high beam and lead car departure notification',
      ],
      'Parking': [
        'Multi-angle reversing camera with fixed guidelines',
        'No 360° camera',
      ],
      'Powertrain & Charging': [
        'Two-motor e:HEV self-charging hybrid, 96 kW / 253 Nm drive motor',
        'Electronic parking brake with auto hold',
      ],
      'Infotainment & Connectivity': [
        '9-inch touchscreen with Apple CarPlay and Android Auto',
        '7-inch digital driver display',
        '6-speaker audio',
      ],
      'Seats & Interior': [
        'Perforated leather upholstery, manually adjusted front seats',
        'Leather-wrapped steering wheel and gear knob',
        '60:40 split rear seat that folds flat',
      ],
      'Comfort & Convenience': [
        'Single-zone automatic climate control with rear vents',
        'Wireless phone charger',
        'Two USB-C ports for rear passengers',
        'Power tailgate with kick sensor',
        'Smart keyless entry, push-button start and walk-away lock',
      ],
      'Exterior & Lighting': [
        'LED headlights with LED daytime running lights',
        'Full-width rear LED light strip',
        '18-inch machined alloy wheels',
        'No sunroof',
        'Puncture repair kit instead of a spare wheel (battery sits under the floor)',
      ],
    },
    sources: ['https://www.pakwheels.com/blog/?p=211989', 'https://paknev.com/cars/honda-hr-v-e-hev'],
    checked: '2026-11-03',
  },
  'toyota-corolla-cross-hev': {
    trim: 'HEV, with HEV X additions marked',
    groups: {
      'Safety': [
        'Seven airbags including a driver knee airbag',
        'ABS, EBD and brake assist',
        'Stability control, traction control and hill start assist',
        'ISOFIX child seat anchors',
        'Immobiliser with alarm',
      ],
      'Driver Assistance (ADAS)': [
        'Cruise control',
        'HEV X: blind spot monitor',
        'HEV X: rear cross-traffic alert',
      ],
      'Parking': [
        'Reversing camera',
        'Front (2) and rear (4) parking sensors',
      ],
      'Powertrain & Charging': [
        '1.8-litre self-charging hybrid with e-CVT',
        'EV, Eco and Power drive modes',
        'Regenerative braking',
      ],
      'Infotainment & Connectivity': [
        '7-inch touchscreen (HEV X: 9-inch floating display)',
        'Wireless Apple CarPlay and Android Auto, energy monitor',
        '6 speakers',
        'Colour driver display, 4.2-inch (HEV X: 7-inch)',
        'Two fast USB-C ports for rear passengers',
      ],
      'Seats & Interior': [
        'Fabric seats with manual adjustment',
        'HEV X: leather seats with 6-way powered driver seat',
        'Leather steering wheel with audio, phone and cruise switches',
        'Rear armrest with cupholders',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Smart entry and push-button start',
        'HEV X: power tailgate with kick sensor',
        'HEV X: auto-dimming rear-view mirror',
        'HEV X: rain-sensing wipers',
      ],
      'Exterior & Lighting': [
        'Bi-beam LED headlights with daytime running lights and automatic lights',
        'LED fog lamps and LED rear lamps',
        'Power-folding mirrors with indicators',
        '17-inch alloy wheels',
        'HEV X: moonroof',
        'HEV X: black roof rails',
      ],
    },
    sources: ['https://toyota-indus.com/wp-content/uploads/2024/03/Specs-Sheet-Final-4-Variants-CP-YQ.pdf', 'https://toyota-indus.com/corolla-cross/'],
    checked: '2026-11-03',
  },
  'honri-ve-2': {
    groups: {
      'Safety': [
        'Driver and passenger airbags',
        'ABS with EBD',
        'Tyre pressure monitoring',
        'ISOFIX child seat anchors',
        'Pedestrian warning sound',
      ],
      'Parking': [
        'Reversing camera',
        'Rear parking sensors',
      ],
      'Powertrain & Charging': [
        '18.5 kWh battery, 3.3 kW AC charging through a Type 2 inlet',
        'Regenerative braking',
        'Eco and Sport drive modes',
        'Rotary gear selector',
      ],
      'Infotainment & Connectivity': [
        '10.25-inch floating Android touchscreen with Bluetooth and USB',
        '5-inch colour instrument display',
      ],
      'Seats & Interior': [
        'Two-tone interior',
        'Manually adjusted front seats',
      ],
      'Comfort & Convenience': [
        'Manual air conditioning',
        'Power windows with auto-down',
        'Remote central locking',
      ],
      'Exterior & Lighting': [
        'LED daytime running lights',
        'Halogen projector headlights with height adjustment',
        'Two-tone mirrors with built-in indicators',
        '15-inch alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/honri-ve-2-0', 'https://www.pakwheels.com/new-cars/honri/ve/2-0--8/'],
    checked: '2026-11-03',
  },
  'nora-ev': {
    trim: 'All E-30 versions (same equipment)',
    groups: {
      'Safety': [
        'Anti-theft alarm and electronic lock',
      ],
      'Parking': [
        'Reversing camera',
      ],
      'Powertrain & Charging': [
        'LFP battery, 9.1 kWh (Eco) or 15.1 kWh (Eco+)',
        'REEV versions: small petrol range extender with a 3-litre tank',
        '2.2 kW AC charging, 6–8 hours to full',
      ],
      'Infotainment & Connectivity': [
        'Android touchscreen with Bluetooth',
        'USB port',
      ],
      'Seats & Interior': [
        'Four seats',
      ],
      'Comfort & Convenience': [
        'Air conditioner and heater',
        'Power windows',
        'Remote keyless entry with central locking',
      ],
      'Exterior & Lighting': [
        'Roof rails',
        'Alloy wheels',
        'Spare wheel mounted on the tailgate',
      ],
    },
    sources: ['https://paknev.com/cars/nora-ev-e-30', 'https://www.pakwheels.com/blog/nora-ev-price-out/'],
    checked: '2026-11-03',
  },
  'hyundai-elantra-hybrid': {
    trim: 'Hybrid Blue (single trim)',
    groups: {
      'Safety': [
        'Two airbags (driver and front passenger) only',
        'Stability control, traction control and hill start assist',
      ],
      'Parking': [
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Self-charging hybrid, 139 hp and 264 Nm',
        '6-speed dual-clutch gearbox',
        'Smart, Eco and Sport drive modes',
        'Electronic parking brake with auto hold',
      ],
      'Infotainment & Connectivity': [
        '8-inch touchscreen with wireless Android Auto and Apple CarPlay',
        '10.25-inch digital instrument cluster',
      ],
      'Seats & Interior': [
        'Heated and ventilated front seats',
        '8-way power driver seat with lumbar adjustment',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Wireless phone charger',
        'Keyless entry with push-button and remote engine start',
        'Hands-free smart boot opening',
        'Cruise control',
      ],
      'Exterior & Lighting': [
        'LED headlamps and slim LED daytime running lights',
        'LED tail lights and welcome lamps',
        'Power sunroof',
        '16-inch alloy wheels',
      ],
    },
    sources: ['https://hyundai-nishat.com/wp-content/uploads/2026/08/Price-List-ELANTRA-Hybrid-HNMPL.pdf', 'https://hyundai-nishat.com/elantra-hybrid-specification/'],
    checked: '2026-11-02',
  },
  'hyundai-tucson-hybrid': {
    trim: 'Smart FWD; Signature AWD additions marked',
    groups: {
      'Safety': [
        'Front, side and curtain airbags',
        'Stability control, traction control, hill start assist and downhill brake control',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Level-2 driver assistance suite with more than 20 functions',
        'Adaptive cruise control with stop and go',
        'Blind-spot monitor and blind-spot collision warning',
        'Rear cross-traffic collision warning',
      ],
      'Parking': [
        'Surround-view camera',
        'Front, side and rear parking sensors',
      ],
      'Powertrain & Charging': [
        '1.6 turbo self-charging hybrid, 232 hp and 367 Nm',
        '6-speed automatic with column shift-by-wire and paddle shifters',
        'Eco, Sport and My Drive modes',
        'Signature AWD: HTRAC all-wheel drive with Snow, Mud and Sand terrain modes',
      ],
      'Infotainment & Connectivity': [
        'Twin 12.3-inch curved screens (cluster and touchscreen)',
        'Wireless Android Auto and Apple CarPlay',
        '6 speakers',
        'Signature AWD: colour head-up display',
      ],
      'Seats & Interior': [
        'Heated and ventilated front seats',
        '8-way power driver seat with lumbar adjustment',
        'Ambient lighting',
        'Signature AWD: 8-way power passenger seat and heated steering wheel',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with rear vents',
        'Wireless phone charger',
        'Keyless entry with push-button and remote engine start',
        'Rain-sensing wipers',
        'Signature AWD: fingerprint authentication for the infotainment and engine start',
        'Signature AWD: powered smart tailgate',
      ],
      'Exterior & Lighting': [
        'Full LED headlamps and hidden \'parametric jewel\' daytime lights',
        'Full LED tail lights',
        'Powered panoramic sunroof',
        '18-inch alloy wheels (Signature AWD: 19-inch)',
      ],
    },
    sources: ['https://hyundai-nishat.com/wp-content/uploads/2026/08/Price-List-TUCSON-Hybrid-HNMPL.pdf', 'https://hyundai-nishat.com/tucson-hybrid-specification/'],
    checked: '2026-11-02',
  },
  'hyundai-santa-fe-hybrid': {
    trim: 'Smart FWD; Signature AWD additions marked (Hyundai Nishat spec page shows the Signature AWD only)',
    groups: {
      'Safety': [
        'Six airbags (front, front side and curtain)',
        'Stability control, traction control, hill start assist and downhill brake control',
        'Signature AWD: rear occupant alert and safe exit alert',
      ],
      'Driver Assistance (ADAS)': [
        'Cruise control',
        'Signature AWD: blind-spot monitor and blind-spot collision warning',
        'Signature AWD: rear cross-traffic collision warning',
      ],
      'Parking': [
        'Rear-view camera with front and rear parking sensors',
        'Signature AWD: surround-view camera',
      ],
      'Powertrain & Charging': [
        '1.6 turbo self-charging hybrid, 227 hp and 350 Nm',
        '6-speed automatic with shift-by-wire and paddle shifters',
        'Smart, Eco and Sport drive modes',
        'Signature AWD: HTRAC on-demand AWD with Snow, Mud and Sand modes',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch digital cluster and 8-inch floating touchscreen',
        'Wireless Android Auto and Apple CarPlay',
        'Signature AWD: head-up display',
        'Signature AWD: Harman Kardon audio with subwoofer',
      ],
      'Seats & Interior': [
        'Seven seats in three rows',
        'Heated front seats and heated steering wheel',
        'Power driver and passenger seats',
        'Ambient lighting',
        'Signature AWD: leather upholstery, ventilated front seats, 10-way driver seat with 4-way lumbar and driver memory',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with 2nd-row vents',
        'Wireless phone charger (Signature AWD: plus 180 W power outlets)',
        'Keyless entry with push-button and remote engine start',
        'Hands-free smart boot opening',
        'Rain-sensing wipers',
        'Signature AWD: 3rd-row air-conditioning controls and automatic child locks',
      ],
      'Exterior & Lighting': [
        'LED headlamps (Signature AWD: projector type) with T-shaped daytime lights',
        'LED tail lights',
        'Panoramic sunroof',
        '19-inch alloy wheels with full-size alloy spare',
      ],
    },
    sources: ['https://hyundai-nishat.com/wp-content/uploads/2026/08/Price-List-SANTA-FE-Hybrid-HNMPL.pdf', 'https://hyundai-nishat.com/santa-fe-specification/'],
    checked: '2026-11-02',
  },
  'hyundai-palisade-hybrid': {
    trim: 'Smart (8 seats); Calligraphy (7 seats) additions marked',
    groups: {
      'Safety': [
        'Eight airbags',
        'Stability control, hill start assist and downhill brake control',
        'ISOFIX child-seat mounts',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive (smart) cruise control',
        'Forward collision-avoidance assist',
        'Lane keeping and lane following assist',
        'Blind-spot collision-avoidance assist',
        'Rear cross-traffic collision-avoidance assist',
      ],
      'Parking': [
        'Surround-view monitor',
        'Front, side and rear parking sensors with parking collision-avoidance assist',
      ],
      'Powertrain & Charging': [
        '2.5 turbo self-charging hybrid, 329 hp and 460 Nm, all-wheel drive',
        '6-speed automatic with column shift-by-wire and paddle shifters',
        'Eco, Sport and My Drive modes plus Snow, Mud and Sand terrain modes',
      ],
      'Infotainment & Connectivity': [
        'Panoramic curved twin 12.3-inch displays',
        'Wireless Android Auto and Apple CarPlay',
        'Bose sound system',
      ],
      'Seats & Interior': [
        'Heated and ventilated seats',
        'Power front seats with lumbar support and driver memory',
        'Heated steering wheel',
        'Ambient lighting',
        'Calligraphy: Nappa leather, 2nd-row captain chairs and relaxation seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control plus separate rear automatic climate control',
        'Wireless phone charger',
        'Fingerprint authentication and engine start',
        'Smart keyless entry, push start and remote engine start',
        'Hands-free smart power tailgate',
        'Rear door sunshades',
        'Rain-sensing wipers',
      ],
      'Exterior & Lighting': [
        'Full LED projector headlamps with hidden \'parametric jewel\' daytime lights',
        'LED tail lights',
        'Dual panoramic sunroof',
        '20-inch alloy wheels (Calligraphy: 21-inch)',
        'Calligraphy: welcome escort lights',
      ],
    },
    sources: ['https://hyundai-nishat.com/wp-content/uploads/2026/09/Price-List-PALISADE-Hybrid-Launch.pdf', 'https://hyundai-nishat.com/palisade-hybrid-interior/', 'https://hyundai-nishat.com/palisade-hybrid-exterior/', 'https://hyundai-nishat.com/palisade-hybrid-safety/', 'https://hyundai-nishat.com/palisade-hybrid-smart-sense/', 'https://hyundai-nishat.com/palisade-hybrid-performance/'],
    checked: '2026-11-02',
  },
  'hyundai-ioniq-5': {
    trim: 'Hyundai Nishat publishes one equipment list for both trims (no Smart/Signature split)',
    groups: {
      'Safety': [
        'Six airbags (front, side and curtain)',
        'Stability control, traction control and hill start assist',
        'Rear occupant alert',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Blind-spot view monitor',
      ],
      'Parking': [
        'Surround-view camera and rear camera with dynamic guidelines',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Dual-motor AWD, 305 PS and 605 Nm',
        '84 kWh battery on an 800-volt system',
        'Vehicle-to-load power outlet',
        'Eco, Normal, Sport and Snow drive modes',
        'Regeneration paddles on the steering wheel',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch digital cluster and 12.3-inch touchscreen',
        'Wired Android Auto and Apple CarPlay',
        'Bose audio',
        'Five USB ports',
      ],
      'Seats & Interior': [
        'Leather seats, 10-way power adjustment for driver and passenger',
        'Heated and ventilated front seats with driver memory',
        'Heated rear seats; sliding rear bench',
        'Heated leather steering wheel',
        'Ambient lighting',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Wireless charger and 180 W outlet',
        'Smart key with push-button and remote engine start',
        'Hands-free powered tailgate with height memory',
        'Rear door sunshades and rain-sensing wipers',
      ],
      'Exterior & Lighting': [
        'LED headlamps with \'parametric pixel\' daytime lights and tail lights',
        'Flush door handles',
        'Panoramic sunroof',
        '20-inch alloy wheels',
      ],
    },
    sources: ['https://hyundai-nishat.com/ioniq-5-specification/'],
    checked: '2026-11-02',
  },
  'kia-ev5': {
    trim: 'Air; Earth additions marked',
    groups: {
      'Safety': [
        'Six airbags',
        'Stability control, hill start assist, downhill brake control and multi-collision braking',
      ],
      'Driver Assistance (ADAS)': [
        'Earth: adaptive cruise control',
        'Earth: lane keeping and lane following assist',
        'Earth: forward collision-avoidance assist',
        'Earth: blind-spot collision-avoidance assist and blind-spot view monitor',
        'Earth: rear cross-traffic alert',
      ],
      'Parking': [
        'Rear camera with dynamic guidelines',
        'Earth: surround-view camera, parking sensors and parking collision-avoidance assist',
      ],
      'Powertrain & Charging': [
        'LFP battery: 64.2 kWh (Earth: 88.1 kWh with dual-motor AWD)',
        'One-pedal driving and paddle-adjustable regeneration',
        'Vehicle-to-load socket inside the cabin (Earth: also an external adaptor)',
        'Eco, Normal, Sport and Snow drive modes',
      ],
      'Infotainment & Connectivity': [
        '12.3-inch cluster, 5-inch climate screen and 12.3-inch touchscreen in one panel',
        'Wireless Android Auto and Apple CarPlay',
        '6-speaker audio',
        'Earth: head-up display',
      ],
      'Seats & Interior': [
        'Heated steering wheel',
        'Ambient lighting',
        'Earth: power front seats with massage, ventilated front seats',
        'Earth: driver relaxation seat with leg rest',
      ],
      'Comfort & Convenience': [
        'Cruise control',
        'Wireless phone charger',
        'Powered tailgate with height setting',
        '67-litre front boot',
        'Earth: fingerprint authentication for infotainment and start',
      ],
      'Exterior & Lighting': [
        'LED headlamps, daytime lights and tail lights',
        'Panoramic sunroof',
        'Flush door handles (Earth: automatic)',
        '18-inch alloy wheels (Earth: 19-inch)',
      ],
    },
    sources: ['https://kia-luckymotorcorp.com/app/uploads/2025/11/EV5-Specification-sheet_Final.pdf'],
    checked: '2026-11-02',
  },
  'kia-ev9-gt-line': {
    trim: 'GT-Line (single trim)',
    groups: {
      'Safety': [
        'Seven airbags',
        'Stability control, hill start assist, downhill brake control and multi-collision braking',
        'Rear occupant alert',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Lane keeping and lane following assist 2',
        'Forward collision-avoidance assist 2.0',
        'Blind-spot collision-avoidance assist and blind-spot view monitor',
        'Rear cross-traffic collision-avoidance assist',
        'Driver attention warning, high beam assist and speed limit assist',
      ],
      'Parking': [
        'Surround-view camera',
        'Parking sensors with forward and reverse collision-avoidance assist',
      ],
      'Powertrain & Charging': [
        'Dual-motor AWD, 282.6 kW and 700 Nm',
        '99.8 kWh battery; 10-80% in 24 minutes on a 350 kW charger',
        'Snow, Mud and Sand terrain modes',
        'Vehicle-to-load inside and outside, up to 3.6 kW',
      ],
      'Infotainment & Connectivity': [
        'Twin 12.3-inch screens with a 5-inch climate panel',
        'Wireless Android Auto and Apple CarPlay',
        '14-speaker Meridian audio',
        '12-inch head-up display',
        'Digital side mirrors',
      ],
      'Seats & Interior': [
        'Six seats with swivelling 2nd-row captain chairs',
        'Heated and ventilated 1st and 2nd-row seats',
        'Relaxation seats for driver and passenger, driver memory',
        'Electrically folding 3rd row',
        'Heated power-adjustable steering wheel',
        'Two-colour ambient lighting',
      ],
      'Comfort & Convenience': [
        'Wireless phone charger',
        'Power tailgate',
        '52-litre front boot',
        'Rain sensor',
      ],
      'Exterior & Lighting': [
        'Cube-projection LED headlamps with animated welcome lights',
        'Dual power sunroof',
        'Automatic flush door handles',
        '21-inch alloy wheels',
      ],
    },
    sources: ['https://kia-luckymotorcorp.com/app/uploads/2025/11/EV9-Specification-sheet_Final.pdf'],
    checked: '2026-11-02',
  },
  'kia-sorento-hev': {
    trim: 'HEV FWD; HEV AWD additions marked',
    groups: {
      'Safety': [
        'Six airbags',
        'Stability control, hill start assist, downhill brake control and trailer stability assist',
        'Rear occupant alert',
      ],
      'Driver Assistance (ADAS)': [
        'Cruise control (AWD: adaptive smart cruise)',
        'AWD: lane keeping and lane following assist',
        'AWD: forward collision-avoidance assist and blind-spot collision-avoidance assist',
        'AWD: rear cross-traffic collision-avoidance, safe exit assist, driver attention warning and high beam assist',
      ],
      'Parking': [
        'Rear camera with front and rear parking sensors',
        'AWD: 360-degree camera, blind-spot view monitor and side sensors',
      ],
      'Powertrain & Charging': [
        '1.6 turbo self-charging hybrid, 238 hp and 367 Nm',
        '6-speed automatic with dial shift-by-wire and paddle shifters',
        'AWD: active AWD with torque vectoring and Snow, Mud and Sand modes',
      ],
      'Infotainment & Connectivity': [
        'Dual 12.3-inch curved displays',
        'Wireless Android Auto and Apple CarPlay',
        '8-speaker audio (AWD: 12-speaker Bose)',
        'AWD: colour head-up display',
      ],
      'Seats & Interior': [
        'Seven seats, black leather upholstery',
        'Heated front seats and heated steering wheel',
        '10-way power driver seat',
        '64-colour ambient lighting',
        'AWD: 14-way driver seat with memory, 8-way power passenger seat, ventilated front seats',
      ],
      'Comfort & Convenience': [
        'Wireless phone charger',
        'Smart key with push-button and remote engine start',
        'Smart power tailgate with height memory',
        'One-touch walk-in for 2nd and 3rd rows',
        'AWD: 3rd-row fan control and vents',
      ],
      'Exterior & Lighting': [
        'LED headlamps (AWD: four-cube projection), LED fog lights front and rear',
        'Panoramic sunroof and roof rails',
        '19-inch alloy wheels with full-size alloy spare',
      ],
    },
    sources: ['https://kia-luckymotorcorp.com/app/uploads/2025/05/Sorento-Brochure-Updated.pdf'],
    checked: '2026-11-02',
  },
  'kia-sorento-phev': {
    trim: '1.6T AWD PHEV (single trim)',
    groups: {
      'Safety': [
        'Six airbags',
        'Stability control, hill start assist, downhill brake control and trailer stability assist',
        'Rear occupant alert',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive smart cruise control',
        'Lane keeping and lane following assist',
        'Forward collision-avoidance assist and blind-spot collision-avoidance assist',
        'Rear cross-traffic collision-avoidance, safe exit assist, driver attention warning and high beam assist',
      ],
      'Parking': [
        '360-degree camera and blind-spot view monitor',
        'Front, side and rear parking sensors with reverse collision-avoidance assist',
      ],
      'Powertrain & Charging': [
        '1.6 turbo plug-in hybrid, 249 hp and 367 Nm',
        '13.8 kWh battery, 66 km electric range, EV mode',
        '3.3 kW AC charging, 15-95% in about 3 h 25 min',
        'Active AWD with torque vectoring and Snow, Mud and Sand modes',
      ],
      'Infotainment & Connectivity': [
        'Dual 12.3-inch curved displays',
        'Wireless Android Auto and Apple CarPlay',
        '12-speaker Bose audio',
        'Colour head-up display',
      ],
      'Seats & Interior': [
        'Seven seats, black leather upholstery',
        'Heated and ventilated front seats, heated steering wheel',
        '14-way driver seat with memory, 8-way power passenger seat',
        '64-colour ambient lighting',
      ],
      'Comfort & Convenience': [
        'Wireless phone charger',
        'Smart key with push-button and remote engine start',
        'Smart power tailgate with height memory',
        '3rd-row fan control and vents',
        'One-touch walk-in for 2nd and 3rd rows',
      ],
      'Exterior & Lighting': [
        'Four-cube projection LED headlamps, LED fog lights front and rear',
        'Panoramic sunroof and roof rails',
        '19-inch alloy wheels with full-size alloy spare',
      ],
    },
    sources: ['https://kia-luckymotorcorp.com/app/uploads/2025/05/Sorento-Brochure-Updated.pdf'],
    checked: '2026-11-02',
  },
  'kia-sportage-l-hybrid': {
    trim: 'FWD HEV; AWD HEV additions marked',
    groups: {
      'Safety': [
        'Six airbags (front, side and curtain)',
        'Stability control, hill start assist, downhill brake control and trailer stability assist',
        'Rear occupant alert and ISOFIX anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive smart cruise control',
        'Lane keeping and lane following assist',
        'Forward collision-avoidance assist with pedestrian, cyclist and junction detection',
        'Blind-spot collision-avoidance assist and blind-spot view monitor',
        'Rear cross-traffic collision-avoidance and safe exit warning',
        'Driver attention warning, high beam assist and speed limit assist',
      ],
      'Parking': [
        'Surround-view monitor and rear camera with dynamic guidelines',
        'Front, side and rear sensors with parking collision-avoidance assist',
      ],
      'Powertrain & Charging': [
        '1.6 turbo self-charging hybrid, 235 hp and 368 Nm',
        '6-speed automatic with dial shift-by-wire and paddle shifters',
        'Eco, Sport and My Drive modes',
        'AWD: all-wheel drive with Snow, Mud and Sand terrain modes',
      ],
      'Infotainment & Connectivity': [
        'Curved 12.3-inch cluster and 12.3-inch touchscreen',
        'Wireless Android Auto and Apple CarPlay with voice recognition',
        '6-speaker audio (AWD: Harman Kardon with bass booster)',
        'Switchable infotainment/climate controller',
      ],
      'Seats & Interior': [
        'Black artificial-leather seats, 8-way power driver seat with lumbar',
        '64-colour ambient lighting',
        'AWD: heated and ventilated seats, driver memory, power passenger seat and heated steering wheel',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with 2nd-row vents',
        'Wireless phone charger and USB-C ports front and rear',
        'Smart key with push-button start',
        'Rain-sensing wipers',
        'AWD: smart power tailgate with memory',
      ],
      'Exterior & Lighting': [
        'LED headlamps, daytime lights, fog lamps and tail lights',
        'Panoramic sunroof and roof rack',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://kia-luckymotorcorp.com/app/uploads/2026/07/The-All-New-Sportage-L-Brochure.pdf'],
    checked: '2026-11-02',
  },
  'mercedes-glc-eq': {
    trim: 'GLC 300 4MATIC (the only version sold)',
    groups: {
      'Safety': [
        'Airbags with advanced (adaptive) airbag system',
        'Autonomous emergency braking with collision detection',
        'Driver attention warning and door-opening warning',
        'ISOFIX child-seat anchors',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with speed limiter',
        'Lane keep assist and lane departure warning',
        'Blind-spot detection',
        'Rear cross-traffic alert with automatic braking',
      ],
      'Parking': [
        '360-degree camera with front and rear cameras',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Dual-motor all-wheel drive, 310 kW (421 hp) and 800 Nm',
        '800-volt battery with DC fast charging, CCS2',
        'AIRMATIC air suspension and rear-axle steering',
        'Selectable driving modes and auto brake hold',
      ],
      'Infotainment & Connectivity': [
        'Fourth-generation MBUX on the MB.OS software platform, with over-the-air updates',
        '15.6-inch central touchscreen and digital driver display',
        'Head-up display',
        'Wireless Apple CarPlay and Android Auto, navigation and voice control',
        '12-speaker audio',
      ],
      'Seats & Interior': [
        'Leather upholstery',
        'Electrically adjustable front seats with driver memory and lumbar support',
        'Heated and ventilated front seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with rear vents and an air purifier',
        'Wireless phone charger',
        'Keyless entry with NFC card key and push-button start',
        'Power tailgate and a 128-litre front trunk',
      ],
      'Exterior & Lighting': [
        'Illuminated grille with LED headlights and daytime running lights',
        'Panoramic glass roof',
        'Rain-sensing wipers and automatic headlights',
        'Heated, power-folding mirrors',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/mercedes-benz/glc/300-4matic-eq/', 'https://pkrevenue.com/mercedes-pakistan-launches-electric-glc-300-4matic-suv-price-revealed/', 'https://shahnawazltd-mercedesbenz.com/glc-electric/'],
    checked: '2026-11-03',
  },
  'mercedes-g580-eq': {
    groups: {
      'Driver Assistance (ADAS)': [
        'G-TURN: the car can rotate on the spot on loose ground',
        'G-STEERING: tighter turning circle off-road',
        'Off-road crawl function with three speed levels',
        'Wading depth up to 850 mm',
      ],
      'Powertrain & Charging': [
        'Four electric motors, one per wheel, 432 kW (587 hp) and 1,164 Nm',
        'Torque vectoring',
        'Switchable low range that retunes damping, throttle and steering',
        'Adaptive damping as standard',
        'Battery shielded by a carbon-fibre-reinforced underbody guard',
      ],
      'Exterior & Lighting': [
        'Ladder-frame body with EQ-specific rigid rear axle',
        'Raised bonnet and air curtains in the rear wheel-arch flares',
      ],
    },
    sources: ['https://shahnawazltd-mercedesbenz.com/electric-g-class/'],
    checked: '2026-11-03',
  },
  'mercedes-eqs': {
    trim: 'EQS 450+ (the only version Shahnawaz lists)',
    groups: {
      'Powertrain & Charging': [
        'Rear motor, 300 kW (408 hp) and 505 Nm',
        '800-volt battery, CCS2 DC fast charging',
      ],
      'Infotainment & Connectivity': [
        'MBUX Hyperscreen: driver display, OLED central screen and OLED passenger screen under one glass panel',
        'MBUX multimedia system',
      ],
      'Seats & Interior': [
        'Floating centre console between the front seats',
        'Ambient lighting linked to the driver-assistance systems',
        'Illuminated door panels',
        'Touch-sensitive seat controls in the doors and on the steering wheel',
      ],
    },
    sources: ['https://shahnawazltd-mercedesbenz.com/the-all-new-electric-eqs-sedan/', 'https://shahnawazltd-mercedesbenz.com/eqs-sedan/'],
    checked: '2026-11-03',
  },
  'mercedes-eqs-suv': {
    trim: 'EQS 450 4MATIC SUV as shown by Shahnawaz; optional items marked',
    groups: {
      'Powertrain & Charging': [
        'AIRMATIC air suspension, can be raised by up to 25 mm',
        'Towing up to 1,800 kg with trailer stability control (750 kg for the 450+)',
      ],
      'Infotainment & Connectivity': [
        'Optional: MBUX Hyperscreen with OLED central and passenger screens',
      ],
      'Seats & Interior': [
        'Floating centre console',
        'Active ambient lighting',
        'Touch-sensitive steering-wheel and seat controls',
        'Optional: AMG Line interior with AMG sports seats and nappa steering wheel',
      ],
      'Exterior & Lighting': [
        'DIGITAL LIGHT headlights with over 1.3 million pixels each',
        '20-inch alloy wheels (21-inch AMG wheels optional)',
        'Optional: illuminated running boards, AMG Line and Night packages',
      ],
    },
    sources: ['https://shahnawazltd-mercedesbenz.com/eqs-suv-3/'],
    checked: '2026-11-03',
  },
  'mercedes-eqa': {
    trim: 'EQA 250+ Progressive Line',
    groups: {
      'Parking': [
        'Reversing camera hidden behind the Mercedes star',
      ],
      'Infotainment & Connectivity': [
        'MBUX multimedia system with a high-resolution central screen',
      ],
      'Seats & Interior': [
        'Man-made leather and fabric upholstery',
        'Comfort seats with wide adjustment',
        'Ambient lighting with 64 colours',
        'Leather sports steering wheel',
      ],
      'Exterior & Lighting': [
        'LED High Performance headlights',
        '18-inch aerodynamic alloy wheels',
        'Integrated roof rails and aluminium window trim',
      ],
    },
    sources: ['https://shahnawazltd-mercedesbenz.com/eqa/'],
    checked: '2026-11-03',
  },
  'mercedes-eqb': {
    trim: 'EQB 250+ Progressive Line',
    groups: {
      'Infotainment & Connectivity': [
        'MBUX multimedia system with a high-resolution central screen',
      ],
      'Seats & Interior': [
        'Man-made leather and fabric upholstery',
        'Comfort seats with wide adjustment',
        'Ambient lighting with 64 colours',
        'Leather sports steering wheel',
        'Optional third seat row (up to seven seats)',
      ],
      'Exterior & Lighting': [
        'LED headlights with front and rear light strips',
        '18-inch alloy wheels',
        'Roof rails',
      ],
    },
    sources: ['https://shahnawazltd-mercedesbenz.com/eqb/'],
    checked: '2026-11-03',
  },
  'mini-cooper-electric': {
    trim: 'E and SE, both with the Premium package',
    groups: {
      'Safety': [
        'Six airbags',
        'Autonomous emergency braking',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Lane keep assist and lane departure warning',
        'Blind-spot detection',
      ],
      'Parking': [
        '360-degree camera',
        'Front and rear parking sensors',
      ],
      'Infotainment & Connectivity': [
        'Round OLED central touchscreen running MINI Operating System 9',
        'Head-up display',
        'Apple CarPlay and Android Auto, navigation and voice control',
        'Harman Kardon sound system',
      ],
      'Seats & Interior': [
        'Synthetic leather upholstery',
        'Heated front seats',
        'Ambient lighting projected on the dashboard',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control',
        'Keyless entry and push-button start',
        'Selectable driving modes',
      ],
      'Exterior & Lighting': [
        'Round LED headlights with three selectable light signatures',
        '18-inch John Cooper Works alloy wheels',
        'Panoramic glass roof',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/mini/cooper/e--14/', 'https://www.pakwheels.com/blog/first-look-review-minis-new-cooper-aceman-and-countryman-in-pakistan/', 'https://paknev.com/cars/mini-cooper-electric'],
    checked: '2026-11-03',
  },
  'mini-aceman': {
    trim: 'E and SE, both with the Premium package',
    groups: {
      'Safety': [
        'Six airbags',
        'Autonomous emergency braking',
      ],
      'Driver Assistance (ADAS)': [
        'Lane keep assist and lane departure warning',
        'Cruise control with speed limiter',
      ],
      'Parking': [
        '360-degree camera',
        'Front and rear parking sensors',
      ],
      'Infotainment & Connectivity': [
        'Round OLED central touchscreen running MINI Operating System 9',
        'Wireless Apple CarPlay and Android Auto, navigation and voice assistant',
      ],
      'Seats & Interior': [
        'Synthetic leather upholstery',
        'Heated front seats',
        'Ambient lighting',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with rear vents',
        'Keyless entry and push-button start',
        'Power tailgate',
      ],
      'Exterior & Lighting': [
        'LED headlights and daytime running lights',
        'Panoramic glass roof',
        'Roof rails',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/mini/aceman/e--13/', 'https://www.pakwheels.com/blog/first-look-review-minis-new-cooper-aceman-and-countryman-in-pakistan/', 'https://paknev.com/cars/mini-aceman'],
    checked: '2026-11-03',
  },
  'mini-countryman-electric': {
    trim: 'E; SE ALL4 additions marked',
    groups: {
      'Safety': [
        'Six airbags',
        'Autonomous emergency braking',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Lane keep assist and lane departure warning',
        'Blind-spot detection',
      ],
      'Parking': [
        '360-degree camera',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Single front motor, 150 kW (204 hp)',
        'SE ALL4: dual-motor all-wheel drive, 494 Nm',
        '130 kW DC fast charging',
        'Complimentary 11 kW home charger with installation',
      ],
      'Infotainment & Connectivity': [
        'Round OLED central touchscreen running MINI Operating System 9',
        'Head-up display',
        'Wireless Apple CarPlay and Android Auto, navigation and voice control',
        '12-speaker audio',
      ],
      'Seats & Interior': [
        'Electrically adjustable, heated front seats with lumbar support',
        'Knitted recycled-fabric dashboard',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with rear vents',
        'Wireless phone charger',
        'Hands-free power tailgate',
        'Keyless entry and push-button start',
      ],
      'Exterior & Lighting': [
        'LED headlights with signature daytime running lights',
        'Panoramic glass roof',
        'Roof rails',
      ],
    },
    sources: ['https://www.pakwheels.com/new-cars/mini/countryman/e--12/', 'https://www.pakwheels.com/new-cars/mini/countryman/se/', 'https://www.pakwheels.com/blog/mini-countryman-se-specs-features-pakistan/', 'https://paknev.com/cars/mini-countryman-electric'],
    checked: '2026-11-03',
  },
  'jaecoo-j5-shs': {
    trim: 'Comfort; Premium additions marked',
    groups: {
      'Safety': [
        'Dual front airbags',
        'Premium: front side and side-curtain airbags',
        'ABS with EBD, brake assist and brake override',
        'Tyre pressure monitoring',
        'ISOFIX child-seat mounts',
        'Immobiliser and anti-theft alarm',
      ],
      'Driver Assistance (ADAS)': [
        'Cruise control',
        'Premium: adaptive cruise control',
      ],
      'Parking': [
        'Premium: 540-degree HD camera view',
      ],
      'Powertrain & Charging': [
        'Self-charging 1.5 turbo hybrid, 221 hp and 295 Nm',
        'Dedicated hybrid transmission, front-wheel drive',
        'Fuel economy readout in km/L',
      ],
      'Infotainment & Connectivity': [
        '8-inch digital instrument cluster',
        '9-inch touchscreen with 2 speakers',
        'Premium: 13.2-inch touchscreen and 8 speakers',
        'Wireless Apple CarPlay and Android Auto',
        'Bluetooth hands-free and USB-C ports',
      ],
      'Seats & Interior': [
        'Fabric seats, 6-way manual driver seat',
        'Premium: faux-leather seats, 6-way power driver seat',
        'Premium: ventilated front seats',
        'Premium: front ambient lighting and rear armrest',
        '60/40 split-folding rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control with rear vents',
        'Keyless entry and remote boot release',
        'One-touch power windows',
        'Premium: 50 W wireless phone charger',
        'Premium: acoustic glass and 12 V socket in the boot',
      ],
      'Exterior & Lighting': [
        '18-inch alloy wheels',
        'Automatic halogen headlamps with LED daytime lights',
        'Premium: LED automatic headlamps',
        'Premium: panoramic glass roof',
        'Frameless wipers, rear fog lamp and sport spoiler',
      ],
    },
    sources: ['https://headless-cms.omodajaecoo.pk/wp-content/uploads/2025/12/Jaecoo-J5-Specifications-A4.pdf', 'https://omodajaecoo.pk/jaecoo-j5-shs-h'],
    checked: '2026-11-02',
  },
  'jaecoo-j6': {
    trim: 'All three versions; Premium additions marked',
    groups: {
      'Safety': [
        'Electronic stability and traction control',
        'Hill start assist',
      ],
      'Driver Assistance (ADAS)': [
        'ADAS suite including adaptive cruise control, blind-spot detection and lane-departure prevention',
        'Rear cross-traffic braking',
      ],
      'Parking': [
        '360-degree camera',
        'Parking sensors',
      ],
      'Powertrain & Charging': [
        'Rear-motor drive on Comfort and Luxury (49.9 / 65.6 kWh)',
        'Premium: dual-motor AWD, 279 hp, 69.7 kWh',
        'Eco, Normal, Sport and Custom drive modes',
        'Premium: extra terrain modes (All-road, Slippery, Beach, Muddy, Bumpy)',
        '3.3 kW vehicle-to-load power outlet',
        'Column-mounted electronic gear selector',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch central touchscreen and 9.2-inch driver display',
        'Apple CarPlay and Android Auto',
        'Voice commands',
        'Pioneer 8-speaker audio',
        'Premium: Infinity 12-speaker audio',
        'USB ports front and rear',
      ],
      'Seats & Interior': [
        'Ventilated front and rear seats',
        '6-way power driver seat, 4-way power passenger seat',
        'Premium: electric leg rest for the front passenger',
        '64-colour ambient lighting',
        '60/40 split-folding rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with remote operation',
        '50 W wireless charger with phone-left-behind reminder',
        'Keyless entry and NFC card key',
        'Side-opening power tailgate',
        'Auto-dimming rear-view mirror and acoustic front glass',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'LED headlights, daytime lights and taillights',
        'Rain-sensing wipers and roof rails',
        '18-inch alloy wheels; Premium: 19-inch',
      ],
    },
    sources: ['https://headless-cms.omodajaecoo.pk/wp-content/uploads/2025/02/Jaecoo-Specifications-A4.pdf', 'https://omodajaecoo.pk/jaecoo-j6'],
    checked: '2026-11-02',
  },
  'jaecoo-j7-phev': {
    trim: 'Premium (only version)',
    groups: {
      'Safety': [
        'Seven airbags including a driver\'s knee airbag',
        'Stability control, ABS with EBD, brake assist and brake override',
        'Direct tyre pressure monitoring',
        'ISOFIX child-seat mounts',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control',
        'Forward collision warning with automatic emergency braking',
        'Blind-spot detection and emergency lane keeping',
        'Lane departure prevention',
        'Driver monitoring camera',
      ],
      'Parking': [
        '540-degree HD camera view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        '1.5 turbo plug-in hybrid, 341 hp and 525 Nm',
        '18.3 kWh battery, 90+ km electric range',
        '3.3 kW vehicle-to-load outlet',
      ],
      'Infotainment & Connectivity': [
        '14.8-inch touchscreen and 10.25-inch driver display',
        'Head-up display',
        'Sony 8-speaker audio',
        'Wireless Apple CarPlay and Android Auto',
        'Built-in dash camera and smartphone app connectivity',
      ],
      'Seats & Interior': [
        'Heated and ventilated front seats',
        'Power driver seat with memory and electric lumbar',
        '4-way power passenger seat with rear-seat control button',
        'Ambient lighting',
        'Fold-flat 60/40 rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with N95 filter and air-quality system',
        'Cooled centre armrest box',
        '50 W wireless charger',
        'Passive keyless entry and remote pre-cooling from the key',
        'Hands-free power tailgate',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'LED headlights with automatic and height adjustment',
        'Flush door handles',
        'Heated power mirrors with memory',
        '19-inch alloy wheels and roof rails',
      ],
    },
    sources: ['https://headless-cms.omodajaecoo.pk/wp-content/uploads/2025/09/Jaecoo-J7-Specifications-A4-2-1.pdf', 'https://omodajaecoo.pk/jaecoo-j7-shs-p'],
    checked: '2026-11-02',
  },
  'omoda-7': {
    trim: 'Premium (only version sold)',
    groups: {
      'Safety': [
        'Eight airbags including a front-centre and driver\'s knee airbag',
        'Stability control, multi-collision braking and hill descent control',
        'Direct tyre pressure monitoring',
        'Driver fatigue monitoring and event data recorder',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control with traffic jam and integrated cruise assist',
        'Automatic emergency braking and forward collision warning',
        'Lane departure prevention and emergency lane keeping',
        'Blind-spot detection, lane change assist and door-open warning',
        'Rear cross-traffic alert and braking',
        'Intelligent high-beam control',
      ],
      'Parking': [
        '540-degree HD camera view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        '1.5 turbo plug-in hybrid, 341 hp and 525 Nm',
        '18.4 kWh battery, 90+ km electric range (WLTP)',
        'Normal, Eco and Sport modes',
        '3.3 kW vehicle-to-load outlet',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch sliding touchscreen with Snapdragon 8155 chip',
        '8.8-inch driver display and head-up display',
        'Sony 12-speaker audio',
        'Wireless Apple CarPlay and Android Auto',
        'Four-zone voice control and app connectivity',
        'Built-in dash camera',
      ],
      'Seats & Interior': [
        'Leatherette seats, ventilated in front',
        '6-way power driver seat with memory and lumbar',
        'Zero-gravity passenger seat with massage and leg support',
        'Ambient lighting that pulses with music',
        'Fold-flat 60/40 rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with N95 filter',
        'Built-in cabin fragrance',
        '50 W wireless charger',
        'Keyless entry and power tailgate',
        'Qibla compass',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof with sunshade',
        'Adaptive LED headlights and sequential indicators',
        'Illuminated front bumper lights',
        'Auto-folding heated mirrors with memory',
        '20-inch wheels with red brake calipers',
      ],
    },
    sources: ['https://headless-cms.omodajaecoo.pk/wp-content/uploads/2026/06/OMODA-7-SHS-P-Brochure.pdf', 'https://headless-cms.omodajaecoo.pk/wp-content/uploads/2026/06/Omoda-7-Specifications-A4.pdf'],
    checked: '2026-11-02',
  },
  'omoda-e5': {
    groups: {
      'Safety': [
        'Electronic stability and traction control',
        'Hill start assist',
        'Driver monitoring system',
        'Automatic child locks',
      ],
      'Driver Assistance (ADAS)': [
        'ADAS driver-assistance package',
      ],
      'Parking': [
        '360-degree camera',
        'Parking sensors',
      ],
      'Powertrain & Charging': [
        '150 kW front motor, 61 kWh LFP battery',
        'DC 30-80% in 28 minutes; 11 kW AC',
        'Eco, Normal and Sport modes',
        'Column-mounted electronic gear selector',
      ],
      'Infotainment & Connectivity': [
        'Twin 12.3-inch screens for driver display and infotainment',
        'Sony 8-speaker audio',
        'Apple CarPlay and Android Auto',
        'Voice commands',
      ],
      'Seats & Interior': [
        'Faux-leather seats, ventilated in front',
        '6-way power driver seat, 4-way power passenger seat',
        'Multi-colour ambient lighting',
        'Soft-touch dashboard with contrast stitching',
        '60/40 split-folding rear seats',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with PM2.5 filter and rear vents',
        '50 W wireless charger',
        'Keyless entry',
        'Power tailgate',
      ],
      'Exterior & Lighting': [
        'Power sunroof',
        'LED headlights, fog lights with cornering function and sequential rear indicators',
        'Rain-sensing wipers, puddle lamps and roof rails',
        '18-inch alloy wheels',
      ],
    },
    sources: ['https://headless-cms.omodajaecoo.pk/wp-content/uploads/2025/02/Omoda-Specifications-A4.pdf', 'https://omodajaecoo.pk/omoda-e5'],
    checked: '2026-11-02',
  },
  'jetour-t1-i-dm': {
    groups: {
      'Safety': [
        'Six airbags',
        'Stability and traction control, ABS with EBD and brake assist',
        'Hill hold and hill descent control',
        'Tyre pressure monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS with adaptive cruise control',
        'Automatic emergency braking and forward collision warning',
        'Lane departure warning and lane keeping assist',
        'Blind-spot detection, door-open warning and rear cross-traffic alert',
        'Automatic high beam',
      ],
      'Parking': [
        '540-degree camera view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        '1.5 turbo plug-in hybrid, 340 hp and 530 Nm',
        'CATL 18.4 kWh LFP battery, 100 km NEDC electric range',
        'Fast charge in about half an hour',
        '3.3 kW vehicle-to-load',
        'Sport, Economy, Standard, Snow, EV and HEV modes',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch touchscreen with Snapdragon 8155 chip',
        '10.25-inch digital driver display',
        'Wireless Apple CarPlay and Android Auto',
        'Voice commands',
        '9-speaker Sony audio',
      ],
      'Seats & Interior': [
        'Leather seats',
        'Power driver and passenger seats with ventilation and memory',
        'Driver seat with 4-way lumbar support',
      ],
      'Comfort & Convenience': [
        '50 W wireless charger',
        'Dual-layer sun-protection glass',
      ],
      'Exterior & Lighting': [
        '19-inch wheels (235/60 R19)',
        '600 mm wading depth, 28-degree approach and departure angles',
      ],
    },
    sources: ['https://cache4.pakwheels.com/system/brochures/1511/original/T1_Folded_Flyer-Low.pdf?1788291679'],
    checked: '2026-11-02',
  },
  'jetour-t2-i-dm': {
    groups: {
      'Safety': [
        'Six airbags',
        'Stability and traction control, ABS with EBD and emergency brake assist',
        'Hill hold and hill descent control',
        'Tyre pressure monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Level 2 ADAS with adaptive cruise control',
        'Automatic emergency braking and forward collision warning',
        'Lane departure warning and lane keeping assist',
        'Blind-spot detection, door-open warning and rear cross-traffic alert',
        'Automatic high beam',
      ],
      'Parking': [
        '540-degree camera view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        '1.5 turbo plug-in hybrid with 3-speed DHT, 360 hp and 610 Nm',
        'CATL 18.4 kWh LFP battery, 90 km NEDC electric range',
        'DC 30-80% in about half an hour',
        '3.3 kW vehicle-to-load',
        'Normal, Sport, Economy, Snow, EV and HEV modes',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch touchscreen with Snapdragon 8155 chip',
        '10.25-inch driver display',
        'Wireless Apple CarPlay and Android Auto',
        'Voice commands',
        '12-speaker Sony audio',
      ],
      'Seats & Interior': [
        'Black suede-leather seats',
        '6-way power driver seat with 4-way lumbar, 4-way power passenger seat',
        'Ventilated front seats with memory',
      ],
      'Exterior & Lighting': [
        '20-inch wheels (255/60 R20)',
        '220 mm ground clearance and 700 mm wading depth',
        'Multi-link independent rear suspension',
      ],
    },
    sources: ['https://cache1.pakwheels.com/system/brochures/1504/original/T2_Folded_Flyer.pdf?1783347759'],
    checked: '2026-11-02',
  },
  'icaur-v23': {
    trim: 'RWD; AWD differences marked',
    groups: {
      'Safety': [
        'Dual front, front-side and curtain airbags',
        'Stability control, traction control and hill descent control',
        'Direct tyre pressure monitoring',
        'Child presence detection',
        'ASEAN NCAP 5 stars',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise with integrated cruise and traffic jam assist',
        'Automatic emergency braking, forward and rear collision warning',
        'Lane departure warning and prevention, lane change assist',
        'Blind-spot detection, rear cross-traffic alert and door-open warning',
        'Adaptive matrix headlamp control',
      ],
      'Parking': [
        '540-degree HD camera view',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Rear motor 100 kW, CATL 59.93 kWh, 360 km NEDC',
        'AWD: dual motors 155 kW, 81.8 kWh, 430 km NEDC, 0-100 in 7.5 s',
        'DC 85 kW (AWD 104 kW), 7 kW AC, CCS2',
        '3.3 kW vehicle-to-load',
        'AWD: extra drive modes including Slippery and Offroad',
      ],
      'Infotainment & Connectivity': [
        '15.4-inch touchscreen',
        'Apple CarPlay, Android Auto and screen mirroring',
        'Offline voice control',
        '7 speakers',
        'Over-the-air updates and app connectivity',
      ],
      'Seats & Interior': [
        'Faux-leather seats, ventilated in front',
        '6-way power driver seat, 4-way power passenger seat',
        'Fold-flat split rear seats',
      ],
      'Comfort & Convenience': [
        'Automatic climate control with PM2.5 filter and remote operation',
        'Keyless entry with NFC card key',
        'Acoustic glass',
      ],
      'Exterior & Lighting': [
        'Automatic LED headlights and LED taillights',
        'Illuminated door handles and heated mirrors',
        '19-inch wheels; AWD: 21-inch',
      ],
    },
    sources: ['https://cache1.pakwheels.com/system/brochures/1519/original/iCAUR_%28V23_Leaflet%29_-_Web_compressed.pdf?1789716209'],
    checked: '2026-11-02',
  },
  'icaur-v27': {
    trim: 'AWD (only version)',
    groups: {
      'Safety': [
        'Driver, passenger, front-side, curtain and front-centre airbags',
        'Stability control and roll stability control',
        'Hill descent control and direct tyre pressure monitoring',
        'Driver monitoring system',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise with integrated cruise and traffic jam assist',
        'Automatic emergency braking, forward and rear collision warning',
        'Lane keeping, lane departure prevention and emergency lane keeping',
        'Blind-spot detection, rear cross-traffic alert and braking',
        'Adaptive matrix headlamp control',
      ],
      'Parking': [
        'Fully automatic parking',
        '540-degree HD camera view',
      ],
      'Powertrain & Charging': [
        'Range extender with dual motors, 449 hp and 505 Nm, AWD',
        '34.31 kWh LFP battery, 150 km NEDC electric range',
        'DC 100 kW, 20-80% in 15 minutes; 7 kW wall charger and portable charger',
        '6.6 kW vehicle-to-load',
      ],
      'Infotainment & Connectivity': [
        '15.4-inch 3K touchscreen with Snapdragon 8155',
        '8.88-inch driver display',
        'Wireless Apple CarPlay and Android Auto',
        'Offline voice control',
        '15 Pioneer speakers with subwoofer',
      ],
      'Seats & Interior': [
        'Faux-leather seats with front ventilation',
        '6-way power front seats, driver memory',
        'Multi-colour ambient lighting',
        'Cooled front armrest box',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control with CN95 filter',
        '50 W wireless charger',
        'Keyless entry and start, side-opening tailgate',
        'Double-glazed sunroof',
      ],
      'Exterior & Lighting': [
        'Automatic LED headlights with projector puddle lights',
        '21-inch wheels and full-size spare',
        '220 mm ground clearance, underbody guard and 1.6 t towing',
        'Load-bearing roof rails',
      ],
    },
    sources: ['https://cache1.pakwheels.com/system/brochures/1517/original/iCAUR_%28V27_Brochure%29-01_Web_compressed.pdf?1789716148'],
    checked: '2026-11-02',
  },
  'xpeng-g6': {
    trim: 'Standard Range RWD (the only trim this row covers)',
    groups: {
      'Safety': [
        'Seven airbags',
        'Front and rear integrated cast-aluminium body with a steel-aluminium safety cage',
        'Battery pack integrated into the body with a three-layer crash structure',
      ],
      'Driver Assistance (ADAS)': [
        'Forward collision warning and automatic emergency braking (fit depends on market for this trim)',
        'Blind spot detection, door opening warning and lane departure warning',
        'Lane keep assist and emergency lane keeping',
        'Rear collision warning and rear cross traffic alert',
        'No adaptive cruise or lane centring on this trim (Long Range and Performance only)',
      ],
      'Parking': [
        'Surround-view camera',
        'Automatic parking assist, including auto exit',
        'Remote parking and summon from phone or key',
      ],
      'Powertrain & Charging': [
        'Single rear motor: 185 kW and 440 Nm, 0–100 km/h in 6.94 s',
        '68.5 kWh battery, 480 km WLTP on 18-inch wheels',
        '800V platform: DC 10–80% in about 12 minutes',
        '11 kW AC charging and vehicle-to-load',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch central touchscreen and 10.25-inch driver display',
        '18-speaker XOPERA sound system',
        'Multi-zone voice assistant with English support',
        'Over-the-air updates',
      ],
      'Seats & Interior': [
        'Heated and ventilated front seats with lumbar support',
        'Ambient lighting',
        '571 L boot, 1,374 L with rear seats folded',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control',
        'Wireless phone charging',
      ],
      'Exterior & Lighting': [
        'Full-width front light bar',
        '2.12 m² panoramic glass roof with UV protection',
        '18-inch low-drag alloy wheels',
      ],
    },
    sources: ['https://cdn.shopify.com/s/files/1/0626/4612/4749/files/XPENG-Pakistan-G6-Brochure.pdf', 'https://paknev.com/cars/xpeng-g6'],
    checked: '2026-11-03',
  },
  'xpeng-l03-reev': {
    trim: 'REEV Std (single Pakistan REEV trim)',
    groups: {
      'Safety': [
        'Seven airbags, including a front centre airbag',
        'Tyre-blowout stability control and integrated IPB braking',
        'Tyre pressure monitoring',
        'Doors unlock automatically after a collision',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise control and lane centring',
        'Automatic emergency braking and forward collision warning',
        'Lane departure warning, lane keep assist and emergency lane keeping',
        'Blind spot warning, door opening warning, rear cross traffic and rear collision warning',
        'Traffic sign recognition, intelligent speed assist and auto high beam',
        'Driver monitoring and child-presence detection',
      ],
      'Parking': [
        '360° camera with transparent-underbody view',
        'Automated parking assist, including unmarked spaces',
        '12 ultrasonic sensors',
      ],
      'Powertrain & Charging': [
        '1.5-litre petrol range extender that only charges the battery',
        'Rear motor 183 kW and 280 Nm, 0–100 km/h in 6.8 s',
        '37.2 kWh LFP battery: 240 km electric, 1,100 km combined (WLTP)',
        'DC up to 123 kW (10–80% in 15 min), AC 6.6 kW',
        '6 kW vehicle-to-load',
        'Eco, Comfort and Sport modes, plus Snow and Wet modes',
      ],
      'Infotainment & Connectivity': [
        '15.6-inch 2.5K central screen and 8.8-inch driver display',
        '26.8-inch windscreen head-up display',
        '"Hey XPENG" multilingual voice assistant',
        'Apple CarPlay and Android Auto',
        'Bluetooth phone key and smartphone keyless entry',
      ],
      'Seats & Interior': [
        'Leather seats; heated and ventilated front seats with memory',
        '14-point front-seat massage and 4-way power lumbar',
        'Heated steering wheel',
        '40/20/40 split-folding rear seats',
        '256-colour ambient lighting',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate with PM2.5 filter and rear vents',
        '50 W cooled wireless phone charging and 60 W USB-C ports',
        'Power tailgate; 539 L boot plus underfloor drawer',
        '1,500 kg braked towing',
      ],
      'Exterior & Lighting': [
        '1.31 m² heat-insulating panoramic glass roof',
        'Frameless doors and flush door handles',
        'Full-width rear light bar',
        '18-inch low-drag alloy wheels',
      ],
    },
    sources: ['https://cdn.shopify.com/s/files/1/0626/4612/4749/files/PK_L03_Xpeng_-_1002-c_RE61026.pdf?v=1792356912', 'https://www.xpengpakistan.com/l03', 'https://paknev.com/cars/xpeng-l03-reev'],
    checked: '2026-11-03',
  },
  'xpeng-x9': {
    trim: 'Long Range 2WD Pro+ (single Pakistan trim)',
    groups: {
      'Safety': [
        'Six airbags, with curtain airbags covering all three rows',
        'Front and rear die-cast aluminium body with a 2,000 MPa safety cage',
        'Stability control, auto hold and tyre pressure monitoring',
        'Rear ISOFIX and electronic child locks on the sliding doors',
      ],
      'Driver Assistance (ADAS)': [
        'XPILOT driver assistance on an NVIDIA Orin-X chip with 12 cameras and 3 radars',
        'Adaptive cruise, lane centring and cornering cruise',
        'Automatic emergency braking and forward collision warning',
        'Blind spot detection, door opening warning, lane keep and emergency lane keeping',
        'Rear collision warning and rear cross traffic alert',
        'Driver monitoring and auto high beam',
      ],
      'Parking': [
        '360° camera with transparent-chassis view',
        'Automatic parking and auto exit',
        'Remote parking and remote summon',
      ],
      'Powertrain & Charging': [
        'Front motor 235 kW (315 hp) and 450 Nm',
        '101.5 kWh NMC battery, 590 km WLTP',
        'DC up to 317 kW (10–80% in 20 min), 11 kW AC',
        'Dual-chamber air suspension and active rear-wheel steering',
        '3.3 kW vehicle-to-load',
      ],
      'Infotainment & Connectivity': [
        '17.3-inch central screen and digital driver display',
        '21.4-inch fold-down rear entertainment screen',
        '23-speaker XOPERA sound system (2,180 W)',
        'Snapdragon 8295P cockpit chip and "Hey XPENG" voice assistant',
        'Apple CarPlay and Android Auto; app remote control and OTA updates',
      ],
      'Seats & Interior': [
        'Nappa leather seats for seven',
        '12-way power front seats with heating, ventilation, massage and memory',
        'Second-row 18-way zero-gravity captain\'s chairs with heating, ventilation and massage',
        'Power-folding third row with adjustable backrests and headrests',
      ],
      'Comfort & Convenience': [
        'Five-zone climate with air purification',
        'Hot-and-cold refrigerator',
        'Power sliding doors on both sides and power tailgate',
        'Second-row tray tables and window sunshades',
        '50 W cooled wireless charging in front and rear',
      ],
      'Exterior & Lighting': [
        'Automatic LED headlights with auto high beam',
        'Panoramic glass roof with sunshade',
        'Flush power door handles',
        '20-inch alloy wheels',
      ],
    },
    sources: ['https://cdn.shopify.com/s/files/1/0626/4612/4749/files/XPENG-Pakistan-X9-Brochure.pdf', 'https://paknev.com/cars/xpeng-x9'],
    checked: '2026-11-03',
  },
  'zeekr-009': {
    trim: 'Luxury 7-seater; Ultra Luxury additions marked',
    groups: {
      'Driver Assistance (ADAS)': [
        'Adaptive cruise with lane centring',
        'Automatic lane change',
        'Blind spot monitoring',
      ],
      'Parking': [
        '360° camera with transparent-chassis view',
        'Automated parking assist',
      ],
      'Powertrain & Charging': [
        'Two motors and all-wheel drive: 450 kW and 693 Nm, 0–100 km/h in 4.5 s',
        '116 kWh battery, 582 km WLTP',
        'DC charging 10–80% in about 30 minutes, 11 kW AC',
        'Dual-chamber air suspension',
      ],
      'Infotainment & Connectivity': [
        '15.05-inch OLED centre screen and 17-inch rear roof screen',
        'AR head-up display',
        'Dual Snapdragon 8295 chips',
        '30-speaker Yamaha sound system',
        'Wireless Apple CarPlay',
      ],
      'Seats & Interior': [
        'Nappa leather; 12-way power front seats with ventilation, massage and driver memory',
        'Independent second-row seats with ventilation and massage',
        'Ultra Luxury: six seats with powered leg-rest lounge chairs in row two',
        'Ultra Luxury: reclining third row and headrest speakers',
      ],
      'Comfort & Convenience': [
        'Three-zone climate control',
        'Hot-and-cold refrigerator',
        'Ultra Luxury: hidden Nappa tray tables',
      ],
      'Exterior & Lighting': [
        'Panoramic glass roof',
      ],
    },
    sources: ['https://paknev.com/cars/zeekr-009', 'https://capitalsmartmotors.pk/vehicles/zeekr-009/'],
    checked: '2026-11-03',
  },
  'zeekr-x': {
    trim: 'Premium RWD; Flagship AWD differences marked',
    groups: {
      'Safety': [
        'Seven airbags',
        'Five-star ANCAP rating',
      ],
      'Driver Assistance (ADAS)': [
        'Adaptive cruise, lane centring and lane keep assist',
        'Automatic lane change',
        'Front collision mitigation and rear collision warning',
        'Blind spot monitoring and front/rear cross traffic alert',
        'Face recognition and driver monitoring',
      ],
      'Parking': [
        '360° camera',
        'Automated parking assist',
      ],
      'Powertrain & Charging': [
        'Rear motor 200 kW and 343 Nm, 0–100 km/h in 5.6 s',
        'Flagship AWD: two motors, 315 kW, 0–100 km/h in 3.8 s',
        '66 kWh battery, 440 km WLTP (420 km AWD)',
        'DC charging 10–80% in about 30 minutes',
        'Heat pump',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 8.8-inch driver display',
        'AR head-up display',
        '13-speaker Yamaha sound system',
        'Wireless Apple CarPlay and Android Auto',
        '5G, Wi-Fi hotspot and over-the-air updates',
      ],
      'Seats & Interior': [
        'Vegan leather seats',
        'Ventilated front seats and driver memory',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate control',
        'Wireless phone charging',
        'NFC card and phone key; app remote control',
        'Built-in dash camera recording',
      ],
    },
    sources: ['https://paknev.com/cars/zeekr-x', 'https://capitalsmartmotors.pk/vehicles/zeekr-x/'],
    checked: '2026-11-03',
  },
  'riddara-rd6': {
    trim: 'Econ 4WD; Pro additions marked',
    groups: {
      'Safety': [
        'Four airbags (Pro: six)',
        'ABS, stability control, traction control, hill start and hill descent',
        'Disc brakes on all four wheels',
      ],
      'Driver Assistance (ADAS)': [
        'Automatic emergency braking and forward collision warning',
        'Pro: adaptive cruise and lane keep assist',
        'Pro: blind spot detection and rear cross traffic alert',
      ],
      'Parking': [
        '540° camera and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Two motors and four-wheel drive: 73 kWh battery, 424 km',
        'Six drive modes (Pro: seven)',
        'Pro: 6 kW vehicle-to-load with power sockets in the bed',
        '3,000 kg towing and 815 mm wading depth',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen and 10.25-inch driver display',
        'Voice control',
      ],
      'Seats & Interior': [
        'Leatherette seats for five (Pro: leather with power adjustment)',
        'Multi-function steering wheel',
      ],
      'Comfort & Convenience': [
        'Dual-zone automatic climate with rear vents',
        '70 L lockable front trunk',
        'Keyless entry and push-button start',
        'Pro: wireless phone charging and lockable bed storage',
      ],
      'Exterior & Lighting': [
        'Halogen headlights and 17-inch steel wheels with covers; bed liner',
        'Pro: matrix LED headlights with adaptive high beam and LED light bar',
        'Pro: sliding glass sunroof, roof rails, side steps and 18-inch alloys',
      ],
    },
    sources: ['https://paknev.com/cars/riddara-rd6', 'https://capitalsmartmotors.pk/vehicles/riddara-rd6/'],
    checked: '2026-11-03',
  },
  'hyptec-ht': {
    trim: 'Elite Plus and Ultra Gullwing Door Plus (sources do not separate the trims, apart from the gull-wing doors)',
    groups: {
      'Driver Assistance (ADAS)': [
        'Full driver-assistance suite',
      ],
      'Parking': [
        '360° camera',
      ],
      'Powertrain & Charging': [
        'Rear motor 250 kW (335 hp), 0–100 km/h in 5.8 s',
        '83 kWh LFP battery, 520 km WLTP',
        'DC up to 280 kW, 6.6 kW AC',
      ],
      'Infotainment & Connectivity': [
        '14.6-inch touchscreen',
        '22-speaker Dolby Atmos sound',
        'Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Nappa leather seats; ventilated and massaging front seats',
        'Reclining rear seats with footrests',
        'Ambient lighting',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate control',
        'Wireless phone charging',
        'Power tailgate; 670 L boot',
      ],
      'Exterior & Lighting': [
        'Panoramic sunroof',
        'Ultra Gullwing Door Plus: gull-wing rear doors',
      ],
    },
    sources: ['https://paknev.com/cars/gac-hyptec-ht', 'https://www.pakwheels.com/blog/hyptec-elite-vs-ultra-gullwing/'],
    checked: '2026-11-03',
  },
  'jmev-elight': {
    trim: 'Comfort; Premium differences marked',
    groups: {
      'Safety': [
        'Front and side airbags',
        'Stability control, hill start and hill descent assist',
        'Tyre pressure monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Blind spot monitoring and lane change assist',
        'Rear cross traffic alert and door opening warning',
        'Emergency brake assist',
        'Cruise control',
      ],
      'Parking': [
        '360° camera',
        'Front and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Front motor 221 hp (165 kW)',
        '56.3 kWh LFP battery, 500 km NEDC',
        'DC 30–80% in about 30 minutes; full AC charge in about 10 hours',
        'Eco, Normal and Sport modes',
      ],
      'Infotainment & Connectivity': [
        '7-inch screen and 2 speakers (Premium: 12.4-inch screen and 6 speakers)',
        'Wireless Apple CarPlay and Android Auto',
        'Over-the-air updates',
      ],
      'Seats & Interior': [
        'Leather seats, manually adjusted (Premium: 6-way power driver and passenger seats)',
      ],
      'Comfort & Convenience': [
        'Dual-zone climate with PM2.5 filter',
        'Keyless entry',
        'Electronic parking brake',
        'Wireless phone charging',
      ],
      'Exterior & Lighting': [
        'Automatic LED headlights and rain-sensing wipers',
        'Heated, power-folding mirrors',
        'Concealed door handles',
        'Steel wheels with full-size spare (Premium: alloy wheels)',
        'Premium: panoramic glass roof',
      ],
    },
    sources: ['https://paknev.com/cars/jmev-elight', 'https://capitalsmartmotors.pk/vehicles/jmev-elight/', 'https://www.pakwheels.com/new-cars/jmev/elight/specifications'],
    checked: '2026-11-03',
  },
  'jmev-ev3': {
    trim: 'Comfort; Premium additions marked',
    groups: {
      'Safety': [
        'Driver and front passenger airbags',
        'ISOFIX child-seat anchors',
        'Tyre pressure monitoring',
      ],
      'Driver Assistance (ADAS)': [
        'Blind spot monitoring',
        'Premium: automatic emergency braking and forward collision warning',
        'Premium: adaptive cruise, traffic jam and highway assist',
        'Premium: lane departure warning and lane keep assist; auto high beam',
      ],
      'Parking': [
        '360° camera and rear parking sensors',
      ],
      'Powertrain & Charging': [
        'Front motor 67 hp and 125 Nm',
        '30.24 kWh LFP battery, 271 km WLTP',
        'DC 10–80% in about 42 minutes; full AC charge in about 7 hours',
      ],
      'Infotainment & Connectivity': [
        '10.1-inch touchscreen and 5-inch driver display',
        'Apple CarPlay and Android Auto',
      ],
      'Seats & Interior': [
        'Sport seats and leather-trimmed multi-function steering wheel',
      ],
      'Comfort & Convenience': [
        'Automatic air conditioning',
        'Keyless start with push button',
        'Power windows',
        'Wireless phone charging',
      ],
      'Exterior & Lighting': [
        'Automatic headlights with LED daytime running lights and LED tail lights',
        'Power mirrors with integrated indicators',
        'Alloy wheels',
      ],
    },
    sources: ['https://paknev.com/cars/jmev-ev3', 'https://capitalsmartmotors.pk/vehicles/jmev-ev3/'],
    checked: '2026-11-03',
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
