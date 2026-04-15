import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@googlemaps/js-api-loader', () => ({
  setOptions: vi.fn(),
  importLibrary: vi.fn().mockImplementation(async (name: string) => {
    if (name === 'maps' || name === 'geometry') return undefined
    throw new Error(`unexpected ${name}`)
  }),
}))

describe('googleMapsLoader', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
    delete (window as unknown as { __GOOGLE_MAPS_API_KEY__?: string }).__GOOGLE_MAPS_API_KEY__
    vi.stubGlobal('google', {
      maps: {},
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('hasGoogleMapsApiKey is true when VITE key present', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'test-key')
    const { hasGoogleMapsApiKey } = await import('@/lib/googleMapsLoader')
    expect(hasGoogleMapsApiKey()).toBe(true)
  })

  it('hasGoogleMapsApiKey is true when window key present', async () => {
    window.__GOOGLE_MAPS_API_KEY__ = 'win-key'
    const { hasGoogleMapsApiKey } = await import('@/lib/googleMapsLoader')
    expect(hasGoogleMapsApiKey()).toBe(true)
  })

  it('hasGoogleMapsApiKey is false when no key', async () => {
    const { hasGoogleMapsApiKey } = await import('@/lib/googleMapsLoader')
    expect(hasGoogleMapsApiKey()).toBe(false)
  })

  it('loadGoogleMaps rejects when key missing', async () => {
    const { loadGoogleMaps } = await import('@/lib/googleMapsLoader')
    await expect(loadGoogleMaps()).rejects.toThrow(/Missing Google Maps API key/)
  })
})
