import { importLibrary, setOptions } from '@googlemaps/js-api-loader'

let loadPromise: Promise<typeof google> | null = null

/** Loads Maps JS API once. Requires `VITE_GOOGLE_MAPS_API_KEY` and Maps JavaScript API enabled in GCP. */
export function loadGoogleMaps(): Promise<typeof google> {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  if (!key?.trim()) {
    return Promise.reject(
      new Error('Missing VITE_GOOGLE_MAPS_API_KEY — add it to .env.local (see .env.example).'),
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
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  return Boolean(key?.trim())
}
