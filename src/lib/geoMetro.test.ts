import { describe, expect, it } from 'vitest'

import { distanceKm, formatCoordsShort, inferMetroForTrip, inferMetroFromPoint } from '@/lib/geoMetro'

describe('inferMetroFromPoint', () => {
  it('returns Bangalore for MG Road area', () => {
    expect(inferMetroFromPoint(12.97, 77.59)).toBe('Bangalore')
  })
  it('returns Mumbai for central Mumbai bbox', () => {
    expect(inferMetroFromPoint(19.07, 72.87)).toBe('Mumbai')
  })
  it('returns null outside known boxes', () => {
    expect(inferMetroFromPoint(0, 0)).toBeNull()
  })
})

describe('inferMetroForTrip', () => {
  it('uses midpoint when inside a metro', () => {
    expect(
      inferMetroForTrip(
        { lat: 12.9, lng: 77.5 },
        { lat: 13.0, lng: 77.7 },
      ),
    ).toBe('Bangalore')
  })
})

describe('distanceKm', () => {
  it('is ~0 for identical points', () => {
    const p = { lat: 12.97, lng: 77.59 }
    expect(distanceKm(p, p)).toBe(0)
  })
  it('is positive for distinct points', () => {
    const d = distanceKm({ lat: 12.97, lng: 77.59 }, { lat: 13.0, lng: 77.6 })
    expect(d).toBeGreaterThan(0)
    expect(d).toBeLessThan(50)
  })
})

describe('formatCoordsShort', () => {
  it('formats to 4 decimals', () => {
    expect(formatCoordsShort({ lat: 12.9716, lng: 77.5946 })).toBe('12.9716, 77.5946')
  })
})
