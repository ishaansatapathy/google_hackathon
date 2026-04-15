import type { LatLng } from '@/lib/osrmRoutes'

export type CorridorHint = {
  id: string
  lat: number
  lng: number
  title: string
  detail: string
  kind: 'construction' | 'diversion' | 'night_work' | 'new_driver'
}

const TEMPLATES: Omit<CorridorHint, 'id' | 'lat' | 'lng'>[] = [
  {
    title: 'Construction / lane squeeze (demo)',
    detail:
      'Official diversions change often — maps may lag. New drivers: watch for cones and temp signs, not only GPS.',
    kind: 'construction',
  },
  {
    title: 'Possible night work zone (demo)',
    detail: 'Barricades sometimes appear after peak hours. Slow down before flyovers and merge points.',
    kind: 'night_work',
  },
  {
    title: 'Unmarked median break (demo)',
    detail: 'Locals know odd crossing points; if you are new to this stretch, avoid sudden U-turns.',
    kind: 'new_driver',
  },
  {
    title: 'Service road vs main carriageway (demo)',
    detail: 'Construction often shifts traffic between service lanes — keep lane discipline near bus stops.',
    kind: 'diversion',
  },
  {
    title: 'Dust / reduced visibility (demo)',
    detail: 'Earth movers and debris — use headlights in haze; not always on civic dashboards.',
    kind: 'construction',
  },
  {
    title: 'Temp signal or police-managed junction (demo)',
    detail: 'Timers may not match your app ETA here — pad a few minutes mentally.',
    kind: 'diversion',
  },
  {
    title: 'Footpath encroachment / mixed traffic (demo)',
    detail: 'Two-wheelers may filter from unexpected angles during road work — extra mirror checks.',
    kind: 'new_driver',
  },
]

function hashSeed(a: LatLng, b: LatLng): number {
  const s = `${a.lat.toFixed(5)}|${a.lng.toFixed(5)}|${b.lat.toFixed(5)}|${b.lng.toFixed(5)}`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Straight-line samples between A and B (before OSRM runs). */
function straightSamples(from: LatLng, to: LatLng, n: number): { lat: number; lng: number }[] {
  const out: { lat: number; lng: number }[] = []
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1)
    out.push({ lat: lerp(from.lat, to.lat, t), lng: lerp(from.lng, to.lng, t) })
  }
  return out
}

/** Sample OSRM polyline at roughly even progress along vertex count. */
function pathSamples(coords: [number, number][], n: number): { lat: number; lng: number }[] {
  if (coords.length === 0) return []
  if (coords.length === 1) return [{ lat: coords[0][0], lng: coords[0][1] }]
  const out: { lat: number; lng: number }[] = []
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1)
    const idx = Math.min(coords.length - 1, Math.floor(t * (coords.length - 1)))
    const [lat, lng] = coords[idx]
    out.push({ lat, lng })
  }
  return out
}

/**
 * Demo-only hints along the corridor — not official BBMP / NHAI data.
 * Uses driving polyline when available; otherwise a straight chord between From and To.
 */
export function buildCorridorConstructionHints(
  from: LatLng,
  to: LatLng,
  drivingCoordinates: [number, number][] | null | undefined,
): CorridorHint[] {
  const seed = hashSeed(from, to)
  const count = 4
  const points =
    drivingCoordinates && drivingCoordinates.length >= 2
      ? pathSamples(drivingCoordinates, count)
      : straightSamples(from, to, count)

  const hints: CorridorHint[] = []
  for (let i = 0; i < points.length; i++) {
    const pick = TEMPLATES[(seed + i * 17) % TEMPLATES.length]
    hints.push({
      id: `hint-${seed}-${i}`,
      lat: points[i].lat,
      lng: points[i].lng,
      title: pick.title,
      detail: pick.detail,
      kind: pick.kind,
    })
  }
  return hints
}
