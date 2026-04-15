/**
 * Machine- and human-readable registry of Google products used by Targo.
 * Keep in sync with `GOOGLE_SERVICES.md` at repo root.
 */
export const GOOGLE_STACK = {
  mapsPlatform: {
    apis: ['Maps JavaScript API'] as const,
    npmPackage: '@googlemaps/js-api-loader',
    entrypoints: [
      'src/lib/googleMapsLoader.ts',
      'src/lib/runtimeMapsEnv.ts',
      'scripts/cloud-run-serve.mjs',
    ] as const,
  },
  cloud: {
    products: [
      'Cloud Run',
      'Cloud Build',
      'Artifact Registry',
      'Cloud Logging',
      'Identity and Access Management (IAM)',
    ] as const,
    deployment: {
      build: 'Google Cloud Buildpacks (Node.js) — npm ci, npm run build, OCI image',
      runtime: 'Cloud Run service — PORT, min instances as configured',
      registry: 'Artifact Registry (image storage for Cloud Run revisions)',
    },
  },
  media: {
    youtubeIframeApi: 'src/lib/youtubeIframeApi.ts (Jaam / embedded video)',
  },
} as const

export type GoogleStack = typeof GOOGLE_STACK
