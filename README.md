# google_hackathon — Targo (community safety & commute demo)

React + TypeScript + Vite app: marketing site, **Jaam** social layer, **Commute** (OSRM routes, congestion sim, **SadakBolo** complaint flow on the map), and local dev servers (WebSocket + optional SadakBolo HTTP API).

## Scripts

- `npm run dev` — Vite, WebSocket corridor server, and SadakBolo HTTP API (proxied `/api` in dev).
- `npm run build` — production build.
- `npm run preview` — preview the `dist` output.

## Jam audio

Place licensed MP3s under `public/jaam/` (see `src/lib/jamAudioSamples.ts` for filenames). Large `.mp3` files are gitignored by default.

## Env (optional)

- `VITE_ANTHROPIC_API_KEY` — Jaam AI playlist (Claude).
- `WS_PORT` — WebSocket server port (default `3333`).
- `SADAK_HTTP_PORT` — SadakBolo HTTP API (default `3456`).
