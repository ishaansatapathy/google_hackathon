import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let loadPromise: Promise<typeof google> | null = null

function getGoogleMapsKey(): string | undefined {
  const fromVite = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  if (fromVite?.trim()) return fromVite.trim()
  if (typeof window !== 'undefined' && window.__GOOGLE_MAPS_API_KEY__?.trim()) {
    return window.__GOOGLE_MAPS_API_KEY__.trim()
  }
  return undefined
}

/** Loads Maps JS API once. Key: `.env.local` (dev) or Cloud Run `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY` (runtime). */
export function loadGoogleMaps(): Promise<typeof google> {
  const key = getGoogleMapsKey()
  if (!key?.trim()) {
    return Promise.reject(
      new Error(
        'Missing Google Maps API key — add VITE_GOOGLE_MAPS_API_KEY to .env.local (dev) or GOOGLE_MAPS_API_KEY in Cloud Run (prod).',
      ),
    )
  }
  if (!loadPromise) {
    setOptions({
      key: key.trim(),
      v: 'weekly',
    })
    loadPromise = (async () => {
      await importLibrary('maps')
      await importLibrary('geometry')
      return google
    })()
  }
  return loadPromise
}

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(getGoogleMapsKey()?.trim())
}
