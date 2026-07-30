// src/lib/constants.ts
import {
  Bath,
  Car,
  Hotel,
  MoonStar,
  ShoppingBag,
  Utensils,
  Wifi,
  type LucideIcon,
} from 'lucide-react'

import type { AmenityType, ConnectorType, Coordinates } from './types'

/* -------------------------------------------------------------------------- */
/*  Connector types                                                            */
/* -------------------------------------------------------------------------- */

export interface ConnectorTypeMeta {
  type: ConnectorType
  label: string
  shortLabel: string
  description: string
  current: 'AC' | 'DC'
  typicalMaxPower: number
  /** Hex value for map pins, charts and SVG marks. */
  color: string
  /** Tailwind badge classes — mirrors `getConnectorColor()`. */
  badgeClass: string
}

export const CONNECTOR_TYPES: ConnectorTypeMeta[] = [
  {
    type: 'CCS2',
    label: 'CCS2 (Combo 2)',
    shortLabel: 'CCS2',
    description: 'Pakistan’s de facto DC fast-charging standard for new EVs.',
    current: 'DC',
    typicalMaxPower: 150,
    color: '#2563EB',
    badgeClass: 'bg-plug-blue-50 text-plug-blue-700 border-plug-blue-200',
  },
  {
    type: 'CHAdeMO',
    label: 'CHAdeMO',
    shortLabel: 'CHAdeMO',
    description: 'DC standard on imported Japanese EVs such as the Nissan Leaf.',
    current: 'DC',
    typicalMaxPower: 50,
    color: '#06B6D4',
    badgeClass: 'bg-plug-cyan-50 text-plug-cyan-700 border-plug-cyan-200',
  },
  {
    type: 'Type2',
    label: 'Type 2 (Mennekes)',
    shortLabel: 'Type 2',
    description: 'AC connector used for destination and overnight charging.',
    current: 'AC',
    typicalMaxPower: 22,
    color: '#10B981',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    type: 'Type1',
    label: 'Type 1 (J1772)',
    shortLabel: 'Type 1',
    description: 'Single-phase AC connector found on older imported EVs.',
    current: 'AC',
    typicalMaxPower: 7.4,
    color: '#F59E0B',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    type: 'GBT',
    label: 'GB/T',
    shortLabel: 'GB/T',
    description: 'Chinese standard on directly imported and locally assembled EVs.',
    current: 'DC',
    typicalMaxPower: 60,
    color: '#8B5CF6',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
  },
]

/* -------------------------------------------------------------------------- */
/*  Charging speeds                                                            */
/* -------------------------------------------------------------------------- */

export type ChargingSpeedId = 'slow' | 'fast' | 'rapid' | 'ultra'

export interface ChargingSpeed {
  id: ChargingSpeedId
  label: string
  minKw: number
  maxKw: number
  current: 'AC' | 'DC'
  /** Typical time to take a mid-size EV from 20% to 80%. */
  typicalSessionLabel: string
  description: string
  color: string
}

export const CHARGING_SPEEDS: ChargingSpeed[] = [
  {
    id: 'slow',
    label: 'Slow',
    minKw: 3,
    maxKw: 7,
    current: 'AC',
    typicalSessionLabel: '8–12 hours',
    description: 'Home and workplace charging — plug in overnight.',
    color: '#94A3B8',
  },
  {
    id: 'fast',
    label: 'Fast',
    minKw: 7,
    maxKw: 22,
    current: 'AC',
    typicalSessionLabel: '3–6 hours',
    description: 'Destination charging at malls, hotels and offices.',
    color: '#10B981',
  },
  {
    id: 'rapid',
    label: 'Rapid',
    minKw: 25,
    maxKw: 99,
    current: 'DC',
    typicalSessionLabel: '35–60 minutes',
    description: 'The most common DC tier on Pakistani highways.',
    color: '#06B6D4',
  },
  {
    id: 'ultra',
    label: 'Ultra-rapid',
    minKw: 100,
    maxKw: 350,
    current: 'DC',
    typicalSessionLabel: '15–25 minutes',
    description: 'High-power corridors for long-distance intercity travel.',
    color: '#2563EB',
  },
]

/* -------------------------------------------------------------------------- */
/*  Cities                                                                     */
/* -------------------------------------------------------------------------- */

export type Province =
  | 'Punjab'
  | 'Sindh'
  | 'Khyber Pakhtunkhwa'
  | 'Balochistan'
  | 'Islamabad Capital Territory'
  | 'Azad Jammu & Kashmir'
  | 'Gilgit-Baltistan'

export interface City {
  slug: string
  name: string
  province: Province
  coordinates: Coordinates
}

export const CITIES_PAKISTAN: City[] = [
  { slug: 'karachi', name: 'Karachi', province: 'Sindh', coordinates: { lat: 24.8607, lng: 67.0011 } },
  { slug: 'lahore', name: 'Lahore', province: 'Punjab', coordinates: { lat: 31.5204, lng: 74.3587 } },
  {
    slug: 'islamabad',
    name: 'Islamabad',
    province: 'Islamabad Capital Territory',
    coordinates: { lat: 33.6844, lng: 73.0479 },
  },
  { slug: 'rawalpindi', name: 'Rawalpindi', province: 'Punjab', coordinates: { lat: 33.5651, lng: 73.0169 } },
  { slug: 'faisalabad', name: 'Faisalabad', province: 'Punjab', coordinates: { lat: 31.4504, lng: 73.135 } },
  { slug: 'multan', name: 'Multan', province: 'Punjab', coordinates: { lat: 30.1575, lng: 71.5249 } },
  {
    slug: 'peshawar',
    name: 'Peshawar',
    province: 'Khyber Pakhtunkhwa',
    coordinates: { lat: 34.0151, lng: 71.5805 },
  },
  { slug: 'quetta', name: 'Quetta', province: 'Balochistan', coordinates: { lat: 30.1798, lng: 66.975 } },
  { slug: 'hyderabad', name: 'Hyderabad', province: 'Sindh', coordinates: { lat: 25.396, lng: 68.3578 } },
  { slug: 'gujranwala', name: 'Gujranwala', province: 'Punjab', coordinates: { lat: 32.1877, lng: 74.1945 } },
  { slug: 'sialkot', name: 'Sialkot', province: 'Punjab', coordinates: { lat: 32.4945, lng: 74.5229 } },
  { slug: 'sargodha', name: 'Sargodha', province: 'Punjab', coordinates: { lat: 32.0836, lng: 72.6711 } },
  { slug: 'bahawalpur', name: 'Bahawalpur', province: 'Punjab', coordinates: { lat: 29.3956, lng: 71.6836 } },
  { slug: 'sahiwal', name: 'Sahiwal', province: 'Punjab', coordinates: { lat: 30.6682, lng: 73.1114 } },
  { slug: 'sukkur', name: 'Sukkur', province: 'Sindh', coordinates: { lat: 27.7052, lng: 68.8574 } },
  { slug: 'larkana', name: 'Larkana', province: 'Sindh', coordinates: { lat: 27.56, lng: 68.2264 } },
  {
    slug: 'abbottabad',
    name: 'Abbottabad',
    province: 'Khyber Pakhtunkhwa',
    coordinates: { lat: 34.1688, lng: 73.2215 },
  },
  { slug: 'mardan', name: 'Mardan', province: 'Khyber Pakhtunkhwa', coordinates: { lat: 34.1979, lng: 72.0498 } },
  { slug: 'murree', name: 'Murree', province: 'Punjab', coordinates: { lat: 33.907, lng: 73.3943 } },
  { slug: 'gwadar', name: 'Gwadar', province: 'Balochistan', coordinates: { lat: 25.1264, lng: 62.3225 } },
  {
    slug: 'muzaffarabad',
    name: 'Muzaffarabad',
    province: 'Azad Jammu & Kashmir',
    coordinates: { lat: 34.37, lng: 73.4711 },
  },
  { slug: 'gilgit', name: 'Gilgit', province: 'Gilgit-Baltistan', coordinates: { lat: 35.9208, lng: 74.3144 } },
]

/* -------------------------------------------------------------------------- */
/*  Amenities                                                                  */
/* -------------------------------------------------------------------------- */

export interface AmenityTypeMeta {
  type: AmenityType
  label: string
  icon: LucideIcon
  description: string
}

export const AMENITY_TYPES: AmenityTypeMeta[] = [
  {
    type: 'restaurant',
    label: 'Food & drink',
    icon: Utensils,
    description: 'Restaurant, café or food court on site.',
  },
  {
    type: 'hotel',
    label: 'Hotel',
    icon: Hotel,
    description: 'Accommodation at or adjacent to the station.',
  },
  {
    type: 'parking',
    label: 'Parking',
    icon: Car,
    description: 'Dedicated parking while your vehicle charges.',
  },
  {
    type: 'washroom',
    label: 'Washroom',
    icon: Bath,
    description: 'Clean washroom facilities available to drivers.',
  },
  {
    type: 'wifi',
    label: 'Free Wi-Fi',
    icon: Wifi,
    description: 'Complimentary wireless internet on site.',
  },
  {
    type: 'shopping',
    label: 'Shopping',
    icon: ShoppingBag,
    description: 'Retail outlets or a convenience store nearby.',
  },
  {
    type: 'prayer',
    label: 'Prayer area',
    icon: MoonStar,
    description: 'Masjid or dedicated prayer space on the premises.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Vehicles                                                                   */
/* -------------------------------------------------------------------------- */

export interface EvModel {
  model: string
  slug: string
  batteryCapacityKwh: number
  /** Manufacturer-claimed range, in kilometres. */
  rangeKm: number
  connectorType: ConnectorType
  maxDcChargingKw: number
}

export interface EvMake {
  make: string
  slug: string
  models: EvModel[]
}

export const EV_MAKES: EvMake[] = [
  {
    make: 'BYD',
    slug: 'byd',
    models: [
      { model: 'Atto 3', slug: 'atto-3', batteryCapacityKwh: 60.5, rangeKm: 420, connectorType: 'CCS2', maxDcChargingKw: 88 },
      { model: 'Seal', slug: 'seal', batteryCapacityKwh: 82.5, rangeKm: 570, connectorType: 'CCS2', maxDcChargingKw: 150 },
      { model: 'Dolphin', slug: 'dolphin', batteryCapacityKwh: 44.9, rangeKm: 405, connectorType: 'CCS2', maxDcChargingKw: 60 },
      { model: 'Han', slug: 'han', batteryCapacityKwh: 85.4, rangeKm: 605, connectorType: 'CCS2', maxDcChargingKw: 120 },
    ],
  },
  {
    make: 'MG',
    slug: 'mg',
    models: [
      { model: 'ZS EV', slug: 'zs-ev', batteryCapacityKwh: 50.3, rangeKm: 320, connectorType: 'CCS2', maxDcChargingKw: 76 },
      { model: 'MG4 EV', slug: 'mg4-ev', batteryCapacityKwh: 51, rangeKm: 350, connectorType: 'CCS2', maxDcChargingKw: 88 },
      { model: 'Marvel R', slug: 'marvel-r', batteryCapacityKwh: 70, rangeKm: 402, connectorType: 'CCS2', maxDcChargingKw: 94 },
    ],
  },
  {
    make: 'Deepal',
    slug: 'deepal',
    models: [
      { model: 'S07', slug: 's07', batteryCapacityKwh: 79.97, rangeKm: 520, connectorType: 'CCS2', maxDcChargingKw: 92 },
      { model: 'L07', slug: 'l07', batteryCapacityKwh: 79.97, rangeKm: 580, connectorType: 'CCS2', maxDcChargingKw: 92 },
    ],
  },
  {
    make: 'Hyundai',
    slug: 'hyundai',
    models: [
      { model: 'Ioniq 5', slug: 'ioniq-5', batteryCapacityKwh: 72.6, rangeKm: 481, connectorType: 'CCS2', maxDcChargingKw: 233 },
      { model: 'Kona Electric', slug: 'kona-electric', batteryCapacityKwh: 64, rangeKm: 484, connectorType: 'CCS2', maxDcChargingKw: 77 },
    ],
  },
  {
    make: 'KIA',
    slug: 'kia',
    models: [
      { model: 'EV6', slug: 'ev6', batteryCapacityKwh: 77.4, rangeKm: 528, connectorType: 'CCS2', maxDcChargingKw: 239 },
      { model: 'Niro EV', slug: 'niro-ev', batteryCapacityKwh: 64.8, rangeKm: 460, connectorType: 'CCS2', maxDcChargingKw: 80 },
    ],
  },
  {
    make: 'Audi',
    slug: 'audi',
    models: [
      { model: 'e-tron 50', slug: 'e-tron-50', batteryCapacityKwh: 71, rangeKm: 341, connectorType: 'CCS2', maxDcChargingKw: 120 },
      { model: 'Q8 e-tron', slug: 'q8-e-tron', batteryCapacityKwh: 106, rangeKm: 582, connectorType: 'CCS2', maxDcChargingKw: 170 },
      { model: 'e-tron GT', slug: 'e-tron-gt', batteryCapacityKwh: 93.4, rangeKm: 488, connectorType: 'CCS2', maxDcChargingKw: 270 },
    ],
  },
  {
    make: 'Haval',
    slug: 'haval',
    models: [
      { model: 'Ora 03', slug: 'ora-03', batteryCapacityKwh: 48, rangeKm: 310, connectorType: 'CCS2', maxDcChargingKw: 64 },
    ],
  },
  {
    make: 'Tesla',
    slug: 'tesla',
    models: [
      { model: 'Model 3 Long Range', slug: 'model-3-long-range', batteryCapacityKwh: 75, rangeKm: 629, connectorType: 'CCS2', maxDcChargingKw: 250 },
      { model: 'Model Y Long Range', slug: 'model-y-long-range', batteryCapacityKwh: 75, rangeKm: 533, connectorType: 'CCS2', maxDcChargingKw: 250 },
    ],
  },
  {
    make: 'Nissan',
    slug: 'nissan',
    models: [
      { model: 'Leaf', slug: 'leaf', batteryCapacityKwh: 40, rangeKm: 270, connectorType: 'CHAdeMO', maxDcChargingKw: 46 },
      { model: 'Leaf e+', slug: 'leaf-e-plus', batteryCapacityKwh: 62, rangeKm: 385, connectorType: 'CHAdeMO', maxDcChargingKw: 100 },
    ],
  },
  {
    make: 'Changan',
    slug: 'changan',
    models: [
      { model: 'Lumin', slug: 'lumin', batteryCapacityKwh: 32.8, rangeKm: 301, connectorType: 'GBT', maxDcChargingKw: 40 },
      { model: 'Eado EV460', slug: 'eado-ev460', batteryCapacityKwh: 52.5, rangeKm: 405, connectorType: 'GBT', maxDcChargingKw: 60 },
    ],
  },
  {
    make: 'Seres',
    slug: 'seres',
    models: [
      { model: 'Seres 3', slug: 'seres-3', batteryCapacityKwh: 52, rangeKm: 329, connectorType: 'GBT', maxDcChargingKw: 50 },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export interface NavLink {
  label: string
  href: string
  description: string
}

export const NAV_LINKS: NavLink[] = [
  {
    label: 'Find Stations',
    href: '/stations',
    description: 'Search every public charger in Pakistan by city, connector and speed.',
  },
  {
    label: 'Route Planner',
    href: '/route-planner',
    description: 'Plan intercity trips with charging stops matched to your EV.',
  },
  {
    label: 'Cities',
    href: '/cities',
    description: 'Browse charging coverage city by city.',
  },
  {
    label: 'Vehicles',
    href: '/vehicles',
    description: 'Compare range, battery size and connector for EVs sold in Pakistan.',
  },
  {
    label: 'Add a Station',
    href: '/add-station',
    description: 'Submit a charger and help grow the network map.',
  },
]
