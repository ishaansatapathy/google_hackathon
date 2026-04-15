import type { LatLng } from '@/lib/osrmRoutes'

export type NeighbourhoodMatch = {
  id: string
  displayName: string
  overlapPct: number
  departsInMin: number
  seatsAvailable: number
}

function frac(n: number): number {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

/**
 * Deterministic demo riders on a similar corridor — changes when `tick` or endpoints change.
 */
export function simulateNeighbourhoodMatches(
  from: LatLng,
  to: LatLng,
  tick: number,
): NeighbourhoodMatch[] {
  const seed =
    Math.floor(from.lat * 1e6) +
    Math.floor(from.lng * 1e6) +
    Math.floor(to.lat * 1e6) +
    Math.floor(to.lng * 1e6) +
    tick * 9973

  const labels = [
    { name: 'Aisha', ride: 'white Swift' },
    { name: 'Rohan', ride: 'blue Nexon EV' },
    { name: 'Neha', ride: 'grey i20' },
    { name: 'Vikram', ride: 'compact SUV' },
    { name: 'Kavita', ride: 'EV sedan' },
  ]

  const count = 2 + Math.floor(frac(seed) * 2)
  const out: NeighbourhoodMatch[] = []

  for (let i = 0; i < count; i++) {
    const s = seed + i * 104729
    const overlapPct = 68 + Math.floor(frac(s) * 28)
    const departsInMin = 3 + Math.floor(frac(s * 1.7) * 24)
    const seatsAvailable = 1 + Math.floor(frac(s * 3.1) * 2)
    const L = labels[(i + Math.floor(frac(s * 2.2) * 10)) % labels.length]
    out.push({
      id: `nb-${tick}-${i}`,
      displayName: `${L.name} · ${L.ride}`,
      overlapPct,
      departsInMin,
      seatsAvailable,
    })
  }

  return out
}
