// src/lib/constants.ts
// ═══════════════════════════════════════════════════
// PLUG.PK — CONSTANTS
// ═══════════════════════════════════════════════════

import type { NavLink, ConnectorType, AmenityType, ServiceCategory, PostCategory } from './types'

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

/**
 * The handful offered as shortcuts in the hero and the route planner.
 *
 * Ordered by population, not alphabetically — these are suggestions, and the
 * first three entries of an A-to-Z list ("Abbottabad, Astore, Attock") are not
 * what anybody means by popular.
 */
export const POPULAR_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Peshawar',
] as const

/**
 * Cities and major towns across all four provinces, Azad Kashmir,
 * Gilgit-Baltistan and the capital territory. Alphabetical, because this
 * feeds selects where people scan for a name rather than browse by size.
 *
 * This is geography, which is checkable. It says nothing about whether a
 * charger exists in any of them — a city appearing here only means somebody
 * can pick it when adding a station.
 */
export const PAKISTAN_CITIES = [
  'Abbottabad', 'Astore', 'Attock', 'Badin', 'Bagh',
  'Bahawalnagar', 'Bahawalpur', 'Bannu', 'Batkhela', 'Bhakkar',
  'Bhimber', 'Chakwal', 'Chaman', 'Charsadda', 'Chilas',
  'Chiniot', 'Chitral', 'Dadu', 'Dera Ghazi Khan', 'Dera Ismail Khan',
  'Dera Murad Jamali', 'Faisalabad', 'Ghotki', 'Gilgit', 'Gujranwala',
  'Gujrat', 'Gwadar', 'Hafizabad', 'Hangu', 'Haripur',
  'Hub', 'Hunza', 'Hyderabad', 'Islamabad', 'Jacobabad',
  'Jamshoro', 'Jhang', 'Jhelum', 'Kalat', 'Karachi',
  'Karak', 'Kasur', 'Khairpur', 'Khanewal', 'Kharan',
  'Khushab', 'Khuzdar', 'Kohat', 'Kotli', 'Lahore',
  'Lakki Marwat', 'Larkana', 'Layyah', 'Lodhran', 'Loralai',
  'Mandi Bahauddin', 'Mansehra', 'Mardan', 'Mastung', 'Matiari',
  'Mianwali', 'Mingora', 'Mirpur', 'Mirpur Khas', 'Multan',
  'Muzaffarabad', 'Muzaffargarh', 'Nankana Sahib', 'Narowal', 'Nawabshah',
  'Nowshera', 'Nushki', 'Okara', 'Pakpattan', 'Panjgur',
  'Peshawar', 'Quetta', 'Rahim Yar Khan', 'Rajanpur', 'Rawalakot',
  'Rawalpindi', 'Sahiwal', 'Sanghar', 'Sargodha', 'Sheikhupura',
  'Shikarpur', 'Sialkot', 'Sibi', 'Skardu', 'Sukkur',
  'Swabi', 'Tando Adam', 'Tando Allahyar', 'Tank', 'Thatta',
  'Timergara', 'Toba Tek Singh', 'Turbat', 'Umerkot', 'Usta Mohammad',
  'Vehari', 'Wah Cantonment', 'Zhob',
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

/**
 * Typed companion to SERVICE_CATEGORIES, whose `id` infers as plain `string`.
 * Keyed by ServiceCategory so every consumer is exhaustive by construction.
 */
export interface ServiceCategoryMeta {
  label: string
  description: string
  /** lucide-react icon name, resolved to a component by the UI. */
  icon: 'Car' | 'Wrench' | 'Home' | 'Package' | 'Shield' | 'LifeBuoy'
  /** Tailwind classes for the icon chip. */
  tone: string
  /** Tailwind gradient for card cover placeholders. */
  cover: string
}

export const SERVICE_CATEGORY_META: Record<ServiceCategory, ServiceCategoryMeta> = {
  dealership: {
    label: 'Dealerships',
    description: 'Authorized EV dealers across Pakistan',
    icon: 'Car',
    tone: 'bg-blue-50 text-blue-600',
    cover: 'from-blue-50 to-blue-100',
  },
  'service-center': {
    label: 'Service Centers',
    description: 'Certified EV service and repair',
    icon: 'Wrench',
    tone: 'bg-green-50 text-green-600',
    cover: 'from-green-50 to-green-100',
  },
  'home-charger-installer': {
    label: 'Home Charger Install',
    description: 'Professional home charging setup',
    icon: 'Home',
    tone: 'bg-purple-50 text-purple-600',
    cover: 'from-purple-50 to-purple-100',
  },
  accessories: {
    label: 'Accessories',
    description: 'EV cables, adapters and accessories',
    icon: 'Package',
    tone: 'bg-amber-50 text-amber-600',
    cover: 'from-amber-50 to-amber-100',
  },
  insurance: {
    label: 'Insurance',
    description: 'EV-specific insurance providers',
    icon: 'Shield',
    tone: 'bg-cyan-50 text-cyan-600',
    cover: 'from-cyan-50 to-cyan-100',
  },
  'roadside-assistance': {
    label: 'Roadside Assistance',
    description: '24/7 EV roadside support',
    icon: 'LifeBuoy',
    tone: 'bg-red-50 text-red-600',
    cover: 'from-red-50 to-red-100',
  },
}

/** Ordered category keys — drives tab order and static route generation. */
export const SERVICE_CATEGORY_KEYS: ServiceCategory[] = [
  'dealership',
  'service-center',
  'home-charger-installer',
  'accessories',
  'insurance',
  'roadside-assistance',
]

/** Services offered, listed on each provider's detail page. */
export const SERVICE_OFFERINGS: Record<ServiceCategory, string[]> = {
  dealership: [
    'New EV Sales',
    'Test Drives',
    'Finance',
    'Trade-in',
    'Extended Warranty',
    'Accessories',
  ],
  'service-center': [
    'EV Diagnostics',
    'Battery Health Check',
    'Software Updates',
    'Brake Service',
    'Tyre Rotation',
    'Roadside Recovery',
  ],
  'home-charger-installer': [
    'Site Survey',
    'Charger Supply',
    'Installation',
    'Certification',
    'Smart Charger Setup',
    'Post-install Support',
  ],
  accessories: [
    'Charging Cables',
    'Adapters',
    'Car Covers',
    'Seat Covers',
    'Dash Cams',
    'EV Accessories',
  ],
  insurance: [
    'Comprehensive Cover',
    'Third Party',
    'Battery Cover',
    'Roadside Assistance',
    'No Claims Discount',
    'Online Claims',
  ],
  'roadside-assistance': [
    '24/7 Response',
    'Jump Start',
    'Towing Service',
    'Mobile Charging',
    'Lockout Service',
    'Tyre Assistance',
  ],
}

export interface PostCategoryMeta {
  id: PostCategory
  label: string
  color: string
  /** lucide-react icon name, resolved to a component by the UI. */
  icon: 'MessageCircle' | 'Zap' | 'Map' | 'Car' | 'ShoppingCart' | 'Newspaper'
  /** Tailwind classes for the unselected pill badge. */
  badge: string
  /** Tailwind background for the selected tab. */
  active: string
}

export const POST_CATEGORIES: PostCategoryMeta[] = [
  {
    id: 'general',
    label: 'General EV Talk',
    color: 'blue',
    icon: 'MessageCircle',
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    active: 'bg-blue-600 text-white',
  },
  {
    id: 'charging-experience',
    label: 'Charging',
    color: 'green',
    icon: 'Zap',
    badge: 'border-green-200 bg-green-50 text-green-700',
    active: 'bg-green-600 text-white',
  },
  {
    id: 'trip-report',
    label: 'Trip Reports',
    color: 'purple',
    icon: 'Map',
    badge: 'border-purple-200 bg-purple-50 text-purple-700',
    active: 'bg-purple-600 text-white',
  },
  {
    id: 'vehicle-review',
    label: 'Vehicle Reviews',
    color: 'amber',
    icon: 'Car',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    active: 'bg-amber-600 text-white',
  },
  {
    id: 'buying-advice',
    label: 'Buying Advice',
    color: 'cyan',
    icon: 'ShoppingCart',
    badge: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    active: 'bg-cyan-600 text-white',
  },
  {
    id: 'ev-news',
    label: 'EV News',
    color: 'red',
    icon: 'Newspaper',
    badge: 'border-red-200 bg-red-50 text-red-700',
    active: 'bg-red-600 text-white',
  },
]

/** Keyed lookup for the list above. */
export const POST_CATEGORY_META: Record<PostCategory, PostCategoryMeta> =
  POST_CATEGORIES.reduce<Record<string, PostCategoryMeta>>((accumulator, category) => {
    accumulator[category.id] = category
    return accumulator
  }, {}) as Record<PostCategory, PostCategoryMeta>

export const DEFAULT_MAP_CENTER = {
  lat: 30.3753,
  lng: 69.3451,
  zoom: 5,
}

export const LAHORE_CENTER = { lat: 31.5204, lng: 74.3587 }
export const ISLAMABAD_CENTER = { lat: 33.6844, lng: 73.0479 }
export const KARACHI_CENTER = { lat: 24.8607, lng: 67.0011 }
