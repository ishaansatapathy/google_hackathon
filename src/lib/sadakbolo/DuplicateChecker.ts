import type { IssueType, SadakReport } from '@/lib/sadakbolo/types'

/** Haversine distance in km between two WGS84 points. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export type DuplicateResult = {
  duplicateFound: boolean
  message: string | null
}

/**
 * If another report of the same issue type exists within `radiusKm`, flag as duplicate.
 */
export function checkDuplicate(
  lat: number,
  lng: number,
  issueType: IssueType,
  existing: SadakReport[],
  radiusKm = 0.5,
): DuplicateResult {
  const near = existing.filter((r) => {
    if (r.type !== issueType) return false
    return haversineKm(lat, lng, r.lat, r.lng) <= radiusKm
  })

  if (near.length === 0) {
    return { duplicateFound: false, message: null }
  }

  return {
    duplicateFound: true,
    message: 'Similar issues already reported in this area',
  }
}
