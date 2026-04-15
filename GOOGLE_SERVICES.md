# Google services used in Targo

This project is built for Google Cloud / Maps–centric hackathon tracks. Below is what we integrate and where it appears in the repo.

## Google Maps Platform

| API / library | Purpose | Code / config |
|---------------|---------|----------------|
| **Maps JavaScript API** | Interactive maps (commute, emergency command, SOS live map, location picker) | `@googlemaps/js-api-loader` → `src/lib/googleMapsLoader.ts` |
| **Maps JavaScript API (runtime key)** | Production key via Cloud Run env without rebuilding the Vite bundle | `GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY` → `scripts/cloud-run-serve.mjs`, `src/lib/runtimeMapsEnv.ts` |

Enable **Maps JavaScript API** on the GCP project and restrict the browser key by **HTTP referrer** to your Cloud Run URL (see `DEPLOY-GOOGLE-CLOUD.md`).

## Google Cloud

| Service | Purpose |
|---------|---------|
| **Cloud Run** | Hosts the production SPA + static `dist/` via `npm start` (`scripts/cloud-run-serve.mjs`). |
| **Cloud Build** | Buildpack builds from GitHub (`npm run build` + container). |
| **Artifact Registry** | Stores images produced by Cloud Build (default when deploying to Cloud Run from source). |

## Optional / demo

- **YouTube IFrame API** (Jaam / video widgets) — `src/lib/youtubeIframeApi.ts`, types in `@types/youtube`.

No Google API keys are committed to git; use `.env.local` locally and Cloud Run / Build env in production.
