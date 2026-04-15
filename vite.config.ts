import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Mirrors production `/runtime-env.js` so dev matches Cloud Run behaviour. */
function runtimeEnvPlugin(): Plugin {
  return {
    name: 'runtime-env',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] === '/runtime-env.js') {
          const key = process.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
          res.end(`window.__GOOGLE_MAPS_API_KEY__=${JSON.stringify(key)};`)
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), runtimeEnvPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/lib/**/*.ts', 'src/hooks/**/*.ts'],
      exclude: ['**/*.d.ts', '**/test/**'],
    },
    pool: 'forks',
  },
  server: {
    proxy: {
      '/api/sos': {
        target: 'http://localhost:3457',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'http://localhost:3456',
        changeOrigin: true,
      },
    },
  },
})
