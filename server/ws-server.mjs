/**
 * Commute demo WebSocket — corridor sensor snapshots (~30s) + optional route hints.
 *
 * Messages (JSON):
 *   { type: "connected", message, ts }
 *   { type: "corridor_snapshot", corridors: [{ id, vehicleCount, speedKmh, density }], ts }
 *   { type: "traffic_route", message, preferAlternate?, profile?, ts }
 *
 * Env: WS_PORT (3333), CORRIDOR_INTERVAL_MS (30000)
 */

import { WebSocketServer } from 'ws'

const PORT = Number(process.env.WS_PORT || 3333)
const CORRIDOR_MS = Number(process.env.CORRIDOR_INTERVAL_MS || 30_000)

const CORRIDOR_IDS = ['mum_weh', 'mum_eh', 'del_ring', 'del_nh48', 'blr_orr']

const TRAFFIC_ROUTE = [
  {
    message: 'Primary driving corridor congested — try alternate (sim)',
    preferAlternate: true,
    profile: 'driving',
  },
  {
    message: 'Incident cleared on ring segment (sim)',
    preferAlternate: false,
    profile: 'driving',
  },
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function corridorSnapshot() {
  const t = Date.now()
  const phase = (t / 30000) % (Math.PI * 2)
  const corridors = CORRIDOR_IDS.map((id, i) => {
    const drift = Math.sin(phase + i * 0.7) * 0.12
    return {
      id,
      vehicleCount: Math.floor(450 + 800 * (0.5 + drift) + Math.random() * 120),
      speedKmh: Math.round(Math.max(12, 58 - 0.04 * (450 + 800 * (0.5 + drift)) + Math.random() * 8)),
      density: Math.round((0.38 + 0.45 * (0.5 + drift * 0.5) + Math.random() * 0.08) * 100) / 100,
    }
  })
  return { type: 'corridor_snapshot', corridors, ts: t }
}

let connectionCount = 0
const wss = new WebSocketServer({ port: PORT })

wss.on('listening', () => {
  console.log(`\x1b[32m[ws-server]\x1b[0m ws://localhost:${PORT}`)
  console.log(`\x1b[90m           corridor snapshot every ${CORRIDOR_MS}ms\x1b[0m`)
})

wss.on('connection', (ws, req) => {
  connectionCount++
  const id = connectionCount
  const ip = req.socket.remoteAddress ?? 'unknown'
  console.log(`\x1b[36m[ws #${id}]\x1b[0m ${ip}`)

  ws.send(
    JSON.stringify({
      type: 'connected',
      message: `Live corridor feed — updates every ${CORRIDOR_MS / 1000}s (simulated).`,
      ts: Date.now(),
    }),
  )

  ws.send(JSON.stringify(corridorSnapshot()))

  const corridorTimer = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return
    ws.send(JSON.stringify(corridorSnapshot()))
  }, CORRIDOR_MS)

  const routeTimer = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return
    const tr = pick(TRAFFIC_ROUTE)
    ws.send(
      JSON.stringify({
        type: 'traffic_route',
        message: tr.message,
        preferAlternate: tr.preferAlternate,
        profile: tr.profile,
        ts: Date.now(),
      }),
    )
  }, 45_000)

  ws.on('close', (code) => {
    clearInterval(corridorTimer)
    clearInterval(routeTimer)
    console.log(`\x1b[33m[ws #${id}]\x1b[0m close ${code}`)
  })

  ws.on('error', (err) => {
    clearInterval(corridorTimer)
    clearInterval(routeTimer)
    console.error(`\x1b[31m[ws #${id}]\x1b[0m`, err.message)
  })
})
