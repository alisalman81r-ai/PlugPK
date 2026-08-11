// src/lib/types.ts
// ═══════════════════════════════════════════════════
// PLUG.PK — COMPLETE TYPE DEFINITIONS
// ═══════════════════════════════════════════════════

// ─── Enums ──────────────────────────────────────────

export type ConnectorType =
  | 'CCS2'
  | 'CHAdeMO'
  | 'Type2'
  | 'GBT'
  | 'Type1'

export type ChargingSpeed =
  | 'slow'      // up to 7kW
  | 'fast'      // 7-50kW
  | 'rapid'     // 50-150kW
  | 'ultra'     // 150kW+

export type StationStatus =
  | 'available'
  | 'limited'
  | 'offline'
  | 'unknown'

export type ConnectorStatus =
  | 'available'
  | 'in-use'
  | 'offline'

export type AmenityType =
  | 'restaurant'
  | 'hotel'
  | 'parking'
  | 'washroom'
  | 'wifi'
  | 'shopping'
  | 'prayer'
  | 'cafe'

export type ServiceCategory =
  | 'dealership'
  | 'service-center'
  | 'home-charger-installer'
  | 'accessories'
  | 'insurance'
  | 'roadside-assistance'

export type BusinessType =
  | 'hotel'
  | 'restaurant'
  | 'mall'
  | 'office'
  | 'dealership'
  | 'service-center'
  | 'other'

export type UserRole =
  | 'user'
  | 'business'
  | 'admin'

export type PostCategory =
  | 'general'
  | 'charging-experience'
  | 'trip-report'
  | 'vehicle-review'
  | 'buying-advice'
  | 'ev-news'

// ─── Location ───────────────────────────────────────

export interface Coordinates {
  lat: number
  lng: number
}

export interface Address {
  street: string
  area: string
  city: string
  province: string
  country: string
  postalCode?: string
}

// ─── Connector ──────────────────────────────────────

export interface Connector {
  id: string
  type: ConnectorType
  maxPowerKw: number
  ports: number
  availablePorts: number
  pricePerKwh: number
  pricePerHour?: number
  isFree: boolean
  status: ConnectorStatus
  compatibleVehicles: string[]
}

// ─── Amenity ────────────────────────────────────────

export interface Amenity {
  type: AmenityType
  available: boolean
  note?: string
}

// ─── Operating Hours ────────────────────────────────

export interface DayHours {
  open: string
  close: string
  isClosed: boolean
}

export interface OperatingHours {
  is24Hours: boolean
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

// ─── Review ─────────────────────────────────────────

export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  userVehicle: string
  rating: number
  comment: string
  photos?: string[]
  date: string
  helpfulCount: number
  isVerified: boolean
}

// ─── Station ────────────────────────────────────────

export interface Station {
  id: string
  slug: string
  name: string
  description?: string
  address: Address
  coordinates: Coordinates
  connectors: Connector[]
  amenities: Amenity[]
  operatingHours: OperatingHours
  photos: string[]
  coverPhoto?: string
  rating: number
  reviewCount: number
  status: StationStatus
  isVerified: boolean
  network: string
  /** Operator contact details, surfaced in the station detail sidebar. */
  phone?: string
  website?: string
  businessId?: string
  createdAt: string
  updatedAt: string
  reviews?: Review[]
}

// ─── Vehicle ────────────────────────────────────────

export interface EVModel {
  id: string
  make: string
  model: string
  year: number
  rangeKm: number
  batteryCapacityKwh: number
  connectorTypes: ConnectorType[]
  chargingSpeedKw: number
}

export interface UserVehicle {
  id: string
  userId: string
  evModel: EVModel
  customName?: string
  color?: string
  licensePlate?: string
  isDefault: boolean
}

// ─── Route ──────────────────────────────────────────

export interface RouteInput {
  origin: string
  originCoords: Coordinates
  destination: string
  destinationCoords: Coordinates
  vehicleId: string
  currentBatteryPercent: number
}

export interface RouteStop {
  order: number
  station: Station
  arrivalBatteryPercent: number
  departureBatteryPercent: number
  chargingTimeMinutes: number
  distanceFromPreviousKm: number
}

export interface PlannedRoute {
  id: string
  origin: string
  destination: string
  totalDistanceKm: number
  estimatedDriveTimeMinutes: number
  totalChargingTimeMinutes: number
  stops: RouteStop[]
  vehicle: EVModel
  savedAt?: string
}

// ─── EV Service ─────────────────────────────────────

export interface EVService {
  id: string
  slug: string
  name: string
  category: ServiceCategory
  description: string
  address: Address
  coordinates: Coordinates
  phone: string
  email?: string
  website?: string
  photos: string[]
  coverPhoto?: string
  rating: number
  reviewCount: number
  operatingHours: OperatingHours
  isVerified: boolean
  createdAt: string
}

// ─── Business ───────────────────────────────────────

export interface Business {
  id: string
  userId: string
  name: string
  type: BusinessType
  description: string
  address: Address
  coordinates: Coordinates
  phone: string
  email: string
  website?: string
  photos: string[]
  coverPhoto?: string
  stations: Station[]
  rating: number
  reviewCount: number
  isVerified: boolean
  isPremium: boolean
  operatingHours: OperatingHours
  createdAt: string
}

// ─── Community ──────────────────────────────────────

export interface CommunityPost {
  id: string
  slug: string
  userId: string
  userName: string
  userAvatar?: string
  userVehicle?: string
  title: string
  content: string
  category: PostCategory
  photos?: string[]
  likeCount: number
  commentCount: number
  isLiked?: boolean
  createdAt: string
  updatedAt: string
  comments?: Comment[]
}

export interface Comment {
  id: string
  postId: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  likeCount: number
  isLiked?: boolean
  createdAt: string
}

export interface EVClub {
  id: string
  name: string
  city: string
  memberCount: number
  description: string
  coverPhoto?: string
  isJoined?: boolean
}

// ─── User ────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  city?: string
  vehicles: UserVehicle[]
  savedStations: string[]
  savedRoutes: PlannedRoute[]
  joinedAt: string
}

// ─── Filter ─────────────────────────────────────────

export interface StationFilters {
  connectorTypes: ConnectorType[]
  chargingSpeed: ChargingSpeed | null
  availableOnly: boolean
  minRating: number
  amenities: AmenityType[]
  network: string | null
  maxDistanceKm: number | null
}

// ─── API Response ────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  hasMore: boolean
}

// ─── Navigation ─────────────────────────────────────

export interface NavLink {
  label: string
  href: string
  icon?: string
}

// ─── Stats ──────────────────────────────────────────

export interface PlatformStats {
  totalStations: number
  totalCities: number
  totalUsers: number
  totalReviews: number
}
