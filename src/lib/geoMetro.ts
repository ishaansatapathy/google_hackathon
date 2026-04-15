import type { MetroCity } from '@/lib/congestionEngine'

import type { LatLng } from '@/lib/osrmRoutes'

/** Rough bounding boxes for demo city auto-select */
export function inferMetroFromPoint(lat: number, lng: number): MetroCity | null {
  if (lat >= 18.85 && lat <= 19.45 && lng >= 72.75 && lng <= 73.15) return 'Mumbai'
  if (lat >= 28.35 && lat <= 28.9 && lng >= 76.8 && lng <= 77.55) return 'Delhi'
  if (lat >= 12.82 && lat <= 13.2 && lng >= 77.35 && lng <= 77.85) return 'Bangalore'
  return null
}

export function inferMetroForTrip(a: LatLng, b: LatLng): MetroCity {
  const mid = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }
  const m =
    inferMetroFromPoint(mid.lat, mid.lng) ??
    inferMetroFromPoint(a.lat, a.lng) ??
    inferMetroFromPoint(b.lat, b.lng)
  return m ?? 'Mumbai'
}

/** Haversine km */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)))
}

export function formatCoordsShort(p: LatLng): string {
  return `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`
}
