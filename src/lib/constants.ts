// src/lib/constants.ts
// ═══════════════════════════════════════════════════
// PLUG.PK — CONSTANTS
// ═══════════════════════════════════════════════════

import type { NavLink, ConnectorType, AmenityType } from './types'

export const SITE_CONFIG = {
  name: 'Plug.pk',
  tagline: "Pakistan's EV Ecosystem Platform",
  description: 'Find charging stations, plan routes, and connect with EV owners across Pakistan.',
  url: 'https://plug.pk',
  ogImage: '/og-image.jpg',
  email: 'hello@plug.pk',
  twitter: '@plugpk',
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Map',       href: '/map' },
  { label: 'Routes',    href: '/routes' },
  { label: 'Services',  href: '/services' },
  { label: 'Community', href: '/community' },
]

export const PLATFORM_STATS = {
  totalStations: 250,
  totalCities: 18,
  totalUsers: 5000,
  totalReviews: 1200,
}

export const PAKISTAN_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi',
  'Faisalabad', 'Multan', 'Peshawar', 'Quetta',
  'Sialkot', 'Gujranwala', 'Hyderabad', 'Abbottabad',
  'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Sheikhupura', 'Jhang',
]

export const CONNECTOR_TYPES: ConnectorType[] = [
  'CCS2', 'CHAdeMO', 'Type2', 'GBT', 'Type1'
]

export const AMENITY_TYPES: AmenityType[] = [
  'restaurant', 'hotel', 'parking',
  'washroom', 'wifi', 'shopping', 'prayer', 'cafe'
]

export const EV_MAKES = [
  {
    make: 'BYD',
    models: [
      { model: 'Atto 3', year: 2024, rangeKm: 480, connector: 'CCS2' },
      { model: 'Seal', year: 2024, rangeKm: 580, connector: 'CCS2' },
      { model: 'Han', year: 2023, rangeKm: 521, connector: 'CCS2' },
    ]
  },
  {
    make: 'MG',
    models: [
      { model: 'ZS EV', year: 2024, rangeKm: 440, connector: 'CCS2' },
      { model: 'HS PHEV', year: 2024, rangeKm: 52, connector: 'Type2' },
    ]
  },
  {
    make: 'Changan',
    models: [
      { model: 'Lumin', year: 2024, rangeKm: 301, connector: 'GBT' },
      { model: 'UNI-K PHEV', year: 2024, rangeKm: 80, connector: 'GBT' },
    ]
  },
  {
    make: 'Proton',
    models: [
      { model: 'e.MAS 7', year: 2024, rangeKm: 430, connector: 'CCS2' },
    ]
  },
  {
    make: 'BMW',
    models: [
      { model: 'i4', year: 2023, rangeKm: 590, connector: 'CCS2' },
      { model: 'iX', year: 2023, rangeKm: 630, connector: 'CCS2' },
    ]
  },
  {
    make: 'Mercedes',
    models: [
      { model: 'EQS', year: 2023, rangeKm: 770, connector: 'CCS2' },
    ]
  },
]

export const SERVICE_CATEGORIES = [
  {
    id: 'dealership',
    label: 'Dealerships',
    description: 'Authorized EV dealers across Pakistan',
    count: 24,
    icon: 'Car',
    color: 'blue',
  },
  {
    id: 'service-center',
    label: 'Service Centers',
    description: 'Certified EV service and repair',
    count: 38,
    icon: 'Wrench',
    color: 'green',
  },
  {
    id: 'home-charger-installer',
    label: 'Home Charger Install',
    description: 'Professional home charging setup',
    count: 19,
    icon: 'Home',
    color: 'purple',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    description: 'EV cables, adapters and accessories',
    count: 45,
    icon: 'Package',
    color: 'amber',
  },
  {
    id: 'insurance',
    label: 'Insurance',
    description: 'EV-specific insurance providers',
    count: 8,
    icon: 'Shield',
    color: 'cyan',
  },
  {
    id: 'roadside-assistance',
    label: 'Roadside Assistance',
    description: '24/7 EV roadside support',
    count: 12,
    icon: 'LifeBuoy',
    color: 'red',
  },
]

export const DEFAULT_MAP_CENTER = {
  lat: 30.3753,
  lng: 69.3451,
  zoom: 5,
}

export const LAHORE_CENTER = { lat: 31.5204, lng: 74.3587 }
export const ISLAMABAD_CENTER = { lat: 33.6844, lng: 73.0479 }
export const KARACHI_CENTER = { lat: 24.8607, lng: 67.0011 }
