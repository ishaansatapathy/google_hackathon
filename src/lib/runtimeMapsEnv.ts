/**
 * Cloud Run injects the key via `/runtime-env.js`. The HTML `<script>` should run first,
 * but some caches / CDNs can still leave `window.__GOOGLE_MAPS_API_KEY__` unset before React.
 * This fetch+parse runs once before `createRoot` so map checks see the key.
 */
export async function ensureRuntimeMapsEnv(): Promise<void> {
  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()) return
  if (typeof window === 'undefined') return
  if (window.__GOOGLE_MAPS_API_KEY__?.trim()) return

  try {
    const res = await fetch('/runtime-env.js', { cache: 'no-store' })
    if (!res.ok) return
    const text = await res.text()
    const m = text.match(/__GOOGLE_MAPS_API_KEY__\s*=\s*([^;]+);?/)
    if (!m?.[1]) return
    const raw = m[1].trim()
    try {
      window.__GOOGLE_MAPS_API_KEY__ = JSON.parse(raw) as string
    } catch {
      // Fallback if format ever changes
      window.__GOOGLE_MAPS_API_KEY__ = raw.replace(/^["']|["']$/g, '')
    }
  } catch {
    /* offline / blocked */
  }
}
