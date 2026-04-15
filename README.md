# Targo — Google Maps + Google Cloud (hackathon)

React + TypeScript + Vite: **commute + safety demos**, **Jaam** social layer, **Emergency** command map, **SOS / mesh** flows. Production runs on **Google Cloud Run**; maps use **Google Maps Platform (Maps JavaScript API)**.

---

## Google Cloud & Maps (read this first)

| Layer | Google products |
|--------|-----------------|
| **Maps** | **Maps JavaScript API** via `@googlemaps/js-api-loader` → `src/lib/googleMapsLoader.ts` |
| **Hosting** | **Cloud Run** (`npm start` → `scripts/cloud-run-serve.mjs`) |
| **CI/CD** | **Cloud Build** (Buildpacks) → **Artifact Registry** → deploy to Cloud Run |
| **Observability** | **Cloud Logging** (Cloud Run logs) |
| **Access control** | **IAM** (service accounts for build/deploy) |

**Detailed reference:** [`GOOGLE_SERVICES.md`](./GOOGLE_SERVICES.md) (architecture diagram, tables, API enablement).  
**Deploy steps:** [`DEPLOY-GOOGLE-CLOUD.md`](./DEPLOY-GOOGLE-CLOUD.md).  
**Secrets / keys:** [`SECURITY.md`](./SECURITY.md).

**Code registry:** `src/lib/googleStack.ts` exports `GOOGLE_STACK` (kept in sync with the docs above).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite + local WebSocket / SadakBolo / SOS servers (see `package.json` for full stack) |
| `npm run build` | Production `dist/` (TypeScript + Vite) |
| `npm start` | **Cloud Run** entry: serve `dist/` + `/runtime-env.js` for Maps key |
| `npm test` / `npm run test:coverage` | Vitest (CI runs `npm test`) |
| `npm run preview` | Local preview of `dist/` |

---

## Env (optional)

- `VITE_GOOGLE_MAPS_API_KEY` — local dev Maps key (see `.env.example`).
- `GOOGLE_MAPS_API_KEY` — production (Cloud Run) runtime injection for Maps.
- `VITE_ANTHROPIC_API_KEY` — Jaam AI (Claude).
- `WS_PORT`, `SADAK_HTTP_PORT` — local servers.

---

## Jam audio

Place licensed MP3s under `public/jaam/` (see `src/lib/jamAudioSamples.ts`). Large `.mp3` files are gitignored by default.

---

## Repo layout

- `src/` — React app (maps, commute, emergency, SOS, etc.).
- `server/` — local-only Node servers for demos (not required for Cloud Run static hosting).
- `scripts/cloud-run-serve.mjs` — production static server + Maps runtime env.
