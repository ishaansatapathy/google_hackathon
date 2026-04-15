import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureRuntimeMapsEnv } from '@/lib/runtimeMapsEnv'

describe('ensureRuntimeMapsEnv', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', '')
    delete (window as unknown as { __GOOGLE_MAPS_API_KEY__?: string }).__GOOGLE_MAPS_API_KEY__
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.unstubAllEnvs()
  })

  it('no-ops when VITE_GOOGLE_MAPS_API_KEY is set', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_API_KEY', 'from-vite')
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy
    await ensureRuntimeMapsEnv()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('no-ops when window already has key', async () => {
    window.__GOOGLE_MAPS_API_KEY__ = 'already'
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy
    await ensureRuntimeMapsEnv()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches /runtime-env.js and parses JSON key', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'window.__GOOGLE_MAPS_API_KEY__="parsed-key";',
    }) as unknown as typeof fetch

    await ensureRuntimeMapsEnv()
    expect(window.__GOOGLE_MAPS_API_KEY__).toBe('parsed-key')
  })

  it('ignores failed fetch', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    await ensureRuntimeMapsEnv()
    expect(window.__GOOGLE_MAPS_API_KEY__).toBeUndefined()
  })
})
