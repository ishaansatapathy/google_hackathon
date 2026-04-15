/**
 * SOS mesh-relay demo — in-memory sessions + SSE + WebSocket broadcast (emergency services dashboard).
 * Port: SOS_RELAY_PORT (default 3457)
 *
 * POST /api/sos/alert     → { session }  (starts staged escalation timers)
 * GET  /api/sos/stream    → text/event-stream (sos_alert, sos_update, sos_trace)
 * GET  /api/sos/sessions  → JSON array (latest first)
 * WebSocket on same port — same JSON events as SSE (for live trace UI)
 */

import http from 'node:http'

import { WebSocketServer } from 'ws'

const PORT = Number(process.env.SOS_RELAY_PORT || 3457)

/** @type {import('node:http').ServerResponse[]} */
const sseClients = []

/** @type {Array<{
 *   id: string
 *   createdAt: number
 *   lat: number | null
 *   lng: number | null
 *   message: string
 *   stage: 'nearest_peers' | 'mesh_hop' | 'emergency_escalated'
 *   peersNotified?: number
 *   hops?: number
 * }>} */
const sessions = []

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...cors(),
  })
  res.end(body)
}

/** @type {import('ws').WebSocket[]} */
const wsClients = []

function broadcast(obj) {
  const line = `data: ${JSON.stringify(obj)}\n\n`
  for (const res of sseClients) {
    try {
      res.write(line)
    } catch {
      /* ignore broken pipe */
    }
  }
  const msg = JSON.stringify(obj)
  for (const ws of wsClients) {
    try {
      if (ws.readyState === 1) ws.send(msg)
    } catch {
      /* ignore */
    }
  }
}

function nearbyPeers(lat, lng, n = 3) {
  const r = 0.011
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n + 0.2
    return { lat: lat + r * Math.cos(a), lng: lng + r * Math.sin(a) }
  })
}

function wideRingPeers(lat, lng, n = 5) {
  const r = 0.026
  return Array.from({ length: n }, (_, i) => ({
    lat: lat + r * Math.cos((i * 2 * Math.PI) / n),
    lng: lng + r * Math.sin((i * 2 * Math.PI) / n),
  }))
}

function pushSession(session) {
  const i = sessions.findIndex((s) => s.id === session.id)
  if (i >= 0) sessions[i] = session
  else sessions.unshift(session)
}

function scheduleEscalation(id) {
  setTimeout(() => {
    const s = sessions.find((x) => x.id === id)
    if (!s || s.stage !== 'nearest_peers') return
    const next = { ...s, stage: /** @type {'mesh_hop'} */ ('mesh_hop'), hops: 2 }
    pushSession(next)
    broadcast({ type: 'sos_update', session: next })
  }, 2200)

  setTimeout(() => {
    const s = sessions.find((x) => x.id === id)
    if (!s || s.stage === 'emergency_escalated') return
    const next = { ...s, stage: /** @type {'emergency_escalated'} */ ('emergency_escalated') }
    pushSession(next)
    broadcast({ type: 'sos_update', session: next })
  }, 5600)
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors())
    res.end()
    return
  }

  const url = req.url?.split('?')[0] ?? ''

  if (url === '/api/sos/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      ...cors(),
    })
    res.write(': sos-relay\n\n')
    sseClients.push(res)
    req.on('close', () => {
      const i = sseClients.indexOf(res)
      if (i >= 0) sseClients.splice(i, 1)
    })
    return
  }

  if (url === '/api/sos/sessions' && req.method === 'GET') {
    sendJson(res, 200, sessions)
    return
  }

  if (url === '/api/sos/alert' && req.method === 'POST') {
    let raw = ''
    req.on('data', (c) => {
      raw += c
    })
    req.on('end', () => {
      let body = {}
      try {
        body = JSON.parse(raw || '{}')
      } catch {
        sendJson(res, 400, { error: 'invalid_json' })
        return
      }
      const id = `sos-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const session = {
        id,
        createdAt: Date.now(),
        lat: typeof body.lat === 'number' ? body.lat : null,
        lng: typeof body.lng === 'number' ? body.lng : null,
        message: typeof body.message === 'string' ? body.message.slice(0, 500) : '',
        stage: /** @type {'nearest_peers'} */ ('nearest_peers'),
        peersNotified: 3,
      }
      pushSession(session)
      broadcast({ type: 'sos_alert', session })
      if (typeof session.lat === 'number' && typeof session.lng === 'number') {
        setTimeout(() => {
          broadcast({
            type: 'sos_trace',
            phase: 'nearest',
            session,
            peerTargets: nearbyPeers(session.lat, session.lng, 3),
          })
        }, 450)
        setTimeout(() => {
          broadcast({
            type: 'sos_trace',
            phase: 'mesh_expand',
            session,
            ringTargets: wideRingPeers(session.lat, session.lng, 5),
          })
        }, 2400)
      }
      scheduleEscalation(id)
      sendJson(res, 200, { ok: true, session })
    })
    return
  }

  sendJson(res, 404, { error: 'not_found' })
})

const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  wsClients.push(ws)
  try {
    ws.send(JSON.stringify({ type: 'emergency_ws', message: 'connected', ts: Date.now() }))
  } catch {
    /* ignore */
  }
  ws.on('close', () => {
    const i = wsClients.indexOf(ws)
    if (i >= 0) wsClients.splice(i, 1)
  })
})

server.listen(PORT, () => {
  console.log(`\x1b[32m[sos-relay]\x1b[0m http://localhost:${PORT}  SSE + WebSocket  /api/sos/*`)
})
