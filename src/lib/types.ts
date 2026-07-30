// src/lib/types.ts

export type StationStatus = 'available' | 'limited' | 'offline' | 'unknown'

export type ConnectorStatus = 'available' | 'in-use' | 'offline'

export type ConnectorType = 'CCS2' | 'CHAdeMO' | 'Type2' | 'GBT' | 'Type1'

export type AmenityType =
  | 'restaurant'
  | 'hotel'
  | 'parking'
  | 'washroom'
  | 'wifi'
  | 'shopping'
  | 'prayer'

export interface Coordinates {
  lat: number
  lng: number
}

export interface Connector {
  id: string
  type: ConnectorType
  maxPower: number
  ports: number
  pricePerKwh: number
  status: ConnectorStatus
}

export interface Amenity {
  type: AmenityType
  available: boolean
}

export interface OperatingHours {
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
  is24Hours: boolean
}

export interface Station {
  id: string
  slug: string
  name: string
  address: string
  city: string
  coordinates: Coordinates
  connectors: Connector[]
  amenities: Amenity[]
  rating: number
  reviewCount: number
  status: StationStatus
  operatingHours: OperatingHours
  photos: string[]
  isVerified: boolean
  network: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  userVehicle: string
  rating: number
  comment: string
  date: string
  helpfulCount: number
  photos?: string[]
}

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  rangeKm: number
  connectorType: ConnectorType
  batteryCapacityKwh: number
}

export interface RouteStop {
  station: Station
  arrivalBatteryPercent: number
  departureBatteryPercent: number
  chargingTimeMinutes: number
  stopOrder: number
}
