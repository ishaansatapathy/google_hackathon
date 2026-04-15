/**
 * Public OSRM demo API — routing for driving / cycling / walking.
 * https://project-osrm.org/
 * Demo only: rate limits apply; production would use your own OSRM or Mapbox.
 */

export type OsrmProfile = 'driving' | 'cycling' | 'walking'

export interface LatLng {
  lat: number
  lng: number
}

export interface RouteLeg {
  profile: OsrmProfile | 'driving'
  distanceM: number
  durationS: number
  /** Leaflet-friendly [lat, lng][] */
  coordinates: [number, number][]
  /** Index when multiple driving alternatives exist */
  alternativeIndex?: number
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1'

function coordsToLeaflet(geojsonCoords: [number, number][]): [number, number][] {
  return geojsonCoords.map(([lng, lat]) => [lat, lng])
}

async function parseRouteResponse(
  res: Response,
  profile: OsrmProfile,
  altIndex?: number,
): Promise<RouteLeg | null> {
  if (!res.ok) return null
  const data = (await res.json()) as {
    code?: string
    routes?: Array<{
      distance: number
      duration: number
      geometry?: { coordinates: [number, number][] }
    }>
  }
  if (data.code !== 'Ok' || !data.routes?.[0]?.geometry?.coordinates) return null
  const r = data.routes[0]
  return {
    profile,
    distanceM: r.distance,
    durationS: r.duration,
    coordinates: coordsToLeaflet(r.geometry!.coordinates),
    alternativeIndex: altIndex,
  }
}

export async function fetchRoute(
  profile: OsrmProfile,
  from: LatLng,
  to: LatLng,
): Promise<RouteLeg | null> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${OSRM_BASE}/${profile}/${path}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url)
    return parseRouteResponse(res, profile)
  } catch {
    return null
  }
}

/** Driving with OSRM alternatives — returns 1–2 legs when API provides them */
export async function fetchDrivingAlternatives(
  from: LatLng,
  to: LatLng,
): Promise<RouteLeg[]> {
  const path = `${from.lng},${from.lat};${to.lng},${to.lat}`
  const url = `${OSRM_BASE}/driving/${path}?overview=full&geometries=geojson&alternatives=true`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as {
      code?: string
      routes?: Array<{
        distance: number
        duration: number
        geometry?: { coordinates: [number, number][] }
      }>
    }
    if (data.code !== 'Ok' || !data.routes?.length) return []
    return data.routes.map((r, i) => ({
      profile: 'driving' as const,
      distanceM: r.distance,
      durationS: r.duration,
      coordinates: coordsToLeaflet(r.geometry?.coordinates ?? []),
      alternativeIndex: i,
    }))
  } catch {
    return []
  }
}

/** Haversine distance between two WGS84 points (meters). */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)))
}

/**
 * Path length along returned geometry (sum of segment lengths).
 * OSRM `distance` is authoritative for the road network; this is a cross-check and
 * blends when the geometry is consistent (simplified polylines can be a few % shorter).
 */
export function routeLengthFromPolyline(coordinates: [number, number][]): number {
  if (coordinates.length < 2) return 0
  let sum = 0
  for (let i = 1; i < coordinates.length; i++) {
    sum += haversineMeters(
      coordinates[i - 1][0],
      coordinates[i - 1][1],
      coordinates[i][0],
      coordinates[i][1],
    )
  }
  return sum
}

/** Typical speeds (m/s) when OSRM returns implausible durations for a profile. */
const FALLBACK_SPEED_MS: Record<OsrmProfile, number> = {
  walking: 5 / 3.6, // ~5 km/h
  cycling: 15 / 3.6, // ~15 km/h
  driving: 32 / 3.6, // ~32 km/h mixed urban
}

function plausibleSpeedProfile(profile: OsrmProfile, speedMs: number): boolean {
  if (speedMs <= 0) return false
  switch (profile) {
    case 'walking':
      return speedMs >= 0.4 && speedMs <= 2.2 // walking, not jogging in traffic
    case 'cycling':
      return speedMs >= 1.4 && speedMs <= 9 // urban cycling (~5–32 km/h avg)
    case 'driving':
      return speedMs >= 1.5 && speedMs <= 50
    default:
      return true
  }
}

/**
 * OSRM duration when it matches the profile; otherwise estimate from distance
 * (public demo sometimes returns driving-like times for walk/bike).
 */
export function effectiveDurationSeconds(leg: RouteLeg): number {
  const { profile, distanceM, durationS } = leg
  const d = Math.max(distanceM, 1)
  const t = Math.max(durationS, 1)
  const v = d / t
  if (plausibleSpeedProfile(profile, v)) return durationS
  return Math.max(60, Math.round(distanceM / FALLBACK_SPEED_MS[profile]))
}

/**
 * Prefer blending OSRM meters with polyline length when they agree; otherwise trust OSRM.
 */
export function effectiveDistanceMeters(leg: RouteLeg): number {
  const api = leg.distanceM
  const poly = routeLengthFromPolyline(leg.coordinates)
  if (poly < 20 || !Number.isFinite(poly)) return Math.round(api)
  const rel = Math.abs(api - poly) / Math.max(api, 1)
  return rel > 0.14 ? Math.round(api) : Math.round((api + poly) / 2)
}

/** Values safe to show in the UI (distance + ETA). */
export function getRouteDisplayMetrics(leg: RouteLeg): { distanceM: number; durationS: number } {
  return {
    distanceM: effectiveDistanceMeters(leg),
    durationS: effectiveDurationSeconds(leg),
  }
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(1)} km`
}

export function formatDuration(s: number): string {
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return `${h}h ${rest}m`
}
