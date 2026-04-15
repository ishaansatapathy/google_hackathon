# Security practices (Targo)

## Secrets

- **Never commit** API keys, Clerk secrets, or `.env.local`.
- **Vite client env** (`VITE_*`) is embedded at **build time** — treat it as public in the browser; use **restricted** Google Maps keys (HTTP referrers) and **Clerk publishable** keys only.
- **Cloud Run:** `GOOGLE_MAPS_API_KEY` is injected at **runtime** via `/runtime-env.js` (see `scripts/cloud-run-serve.mjs`). Prefer **Secret Manager** for production if policies require it.

## Maps API key

- Restrict by **HTTP referrer** to your deployment origin (e.g. `https://*.run.app/*` or an exact Cloud Run URL).
- Enable only APIs you need (e.g. **Maps JavaScript API**).

## Inventory

Which Google products are wired in is listed in **`GOOGLE_SERVICES.md`** and mirrored in code as `GOOGLE_STACK` in `src/lib/googleStack.ts`.

## Dependencies

- Run `npm audit` periodically; CI can run `npm audit --audit-level=moderate` (optional).

## Reporting

- If you find a vulnerability in this repo, contact the maintainers privately before public disclosure.
