// src/app/(main)/vehicles/page.tsx
import { permanentRedirect } from 'next/navigation'

/**
 * /vehicles now lives at /cars.
 *
 * The catalogue this route served held identity only — brand, model, powertrain
 * — and has been replaced by the car database at /cars, which carries the
 * prices, batteries, ranges and charging figures a buyer actually compares on.
 *
 * A permanent redirect rather than a deleted route: the path was in the nav and
 * may be linked or indexed, and a 308 moves both a visitor and a crawler across
 * instead of handing either a 404.
 */
export default function VehiclesPage() {
  permanentRedirect('/cars')
}
