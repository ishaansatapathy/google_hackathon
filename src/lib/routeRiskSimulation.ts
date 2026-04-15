import type { RouteLeg } from '@/lib/osrmRoutes'

export type RiskKind = 'accident' | 'traffic' | 'closure'

export interface SimulatedRisk {
  lat: number
  lng: number
  kind: RiskKind
  label: string
  severityScore: number
}

const LABELS: Record<RiskKind, string> = {
  accident: 'Accident (sim)',
  traffic: 'Heavy traffic (sim)',
  closure: 'Lane closure (sim)',
}

function hashSeed(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

/** Place simulated incident markers along a polyline — demo only */
export function risksAlongPolyline(
  coordinates: [number, number][],
  seedKey: string,
): SimulatedRisk[] {
  if (coordinates.length < 6) return []
  const n = coordinates.length
  const fractions = [0.18, 0.38, 0.58, 0.78, 0.92]
  const kinds: RiskKind[] = ['traffic', 'accident', 'traffic', 'closure', 'traffic']
  const out: SimulatedRisk[] = []

  for (let i = 0; i < fractions.length; i++) {
    const idx = Math.min(n - 1, Math.floor(fractions[i] * (n - 1)))
    const [lat, lng] = coordinates[idx]
    const h = hashSeed(seedKey + i)
    const j = (Math.sin(h * 0.001) * 0.0012) as number
    const k = (Math.cos(h * 0.002) * 0.0012) as number
    const kind = kinds[i % kinds.length]
    out.push({
      lat: lat + j,
      lng: lng + k,
      kind,
      label: LABELS[kind],
      severityScore: 40 + (h % 55),
    })
  }
  return out
}

export function mergeRisksForModes(
  walk: RouteLeg | null,
  bike: RouteLeg | null,
  drive: RouteLeg | null,
): { walk: SimulatedRisk[]; bike: SimulatedRisk[]; drive: SimulatedRisk[] } {
  return {
    walk: walk?.coordinates.length ? risksAlongPolyline(walk.coordinates, 'w') : [],
    bike: bike?.coordinates.length ? risksAlongPolyline(bike.coordinates, 'b') : [],
    drive: drive?.coordinates.length ? risksAlongPolyline(drive.coordinates, 'd') : [],
  }
}

export function countNearSeverity(risks: SimulatedRisk[], minScore: number): number {
  return risks.filter((r) => r.severityScore >= minScore).length
}
