/**
 * Simulated congestion / risk zones for Bengaluru (demo — not official traffic data).
 * Rendered as Google Maps circles when “Show risk zones” is on.
 */

export type ZoneLevel = 'high' | 'medium' | 'low'

export type BangaloreRiskZone = {
  id: string
  label: string
  lat: number
  lng: number
  /** metres */
  radiusM: number
  level: ZoneLevel
}

export const BANGALORE_RISK_ZONES: readonly BangaloreRiskZone[] = [
  { id: 'cbd-orr', label: 'CBD · ORR knot', lat: 12.9716, lng: 77.5946, radiusM: 4200, level: 'high' },
  { id: 'whitefield-corridor', label: 'Whitefield corridor', lat: 12.97, lng: 77.75, radiusM: 5500, level: 'high' },
  { id: 'ecity-silk', label: 'Electronic City · Silk Board', lat: 12.85, lng: 77.655, radiusM: 4800, level: 'medium' },
  { id: 'hebbal-jn', label: 'Hebbal · airport road', lat: 13.035, lng: 77.597, radiusM: 4500, level: 'medium' },
  { id: 'peenya-ind', label: 'Peenya industrial', lat: 13.03, lng: 77.51, radiusM: 4000, level: 'medium' },
  { id: 'mysore-road', label: 'Mysore Road · Kengeri', lat: 12.91, lng: 77.485, radiusM: 5200, level: 'low' },
  { id: 'north-ring', label: 'Yelahanka ring', lat: 13.09, lng: 77.595, radiusM: 5000, level: 'low' },
]

export type SecurityCheckpoint = {
  id: string
  label: string
  lat: number
  lng: number
}

/** Extra “security / checkpoint” pins (demo) — distinct from police stations. */
export const BANGALORE_SECURITY_CHECKPOINTS: readonly SecurityCheckpoint[] = [
  { id: 'ck-km', label: 'Checkpoint · Km 10 (demo)', lat: 12.935, lng: 77.61 },
  { id: 'ck-silk', label: 'Silk Board junction (demo)', lat: 12.918, lng: 77.622 },
  { id: 'ck-hebbal', label: 'Hebbal flyover (demo)', lat: 12.998, lng: 77.594 },
  { id: 'ck-tin', label: 'Tin Factory (demo)', lat: 13.007, lng: 77.708 },
  { id: 'ck-marath', label: 'Marathahalli ORR (demo)', lat: 12.959, lng: 77.698 },
  { id: 'ck-ec', label: 'Electronic City toll (demo)', lat: 12.848, lng: 77.67 },
  { id: 'ck-peenya', label: 'Peenya Naka (demo)', lat: 13.028, lng: 77.52 },
  { id: 'ck-mysore', label: 'Nayandahalli (demo)', lat: 12.943, lng: 77.523 },
  { id: 'ck-airport', label: 'Airport road (demo)', lat: 13.115, lng: 77.61 },
  { id: 'ck-mekri', label: 'Mekri circle (demo)', lat: 13.035, lng: 77.575 },
]
