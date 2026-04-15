/// <reference types="vite/client" />

interface Window {
  /** Injected by Cloud Run / `scripts/cloud-run-serve.mjs` via `/runtime-env.js` */
  __GOOGLE_MAPS_API_KEY__?: string
}

interface ImportMetaEnv {
  /** Google Maps JavaScript API (Maps JavaScript API in Cloud Console) */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string
  readonly VITE_WS_URL?: string
  /** Anthropic API key for Jaam (Claude) — never commit production keys */
  readonly VITE_ANTHROPIC_API_KEY?: string
  /** Clerk publishable key (Dashboard → API keys) */
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
