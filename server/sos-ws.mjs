/**
 * SOS live simulation WebSocket — responder moves toward user; distance + ETA tick (demo).
 * Port: SOS_WS_PORT (default 3334)
 *
 * Client → server (once after open):
 *   { "type": "sos_start", "lat": number, "lng": number }
 *
 * Server → client:
 *   { "type": "sos_tick", userLat, userLng, responderLat, responderLng, distanceM, etaSec, progress, ts }
 */

import { WebSocketServer } from 'ws'

const PORT = Number(process.env.SOS_WS_PORT || 3334)

function haversineM(a, b) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, x)))
}

function interpolate(a, b, t) {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }
}

const wss = new WebSocketServer({ port: PORT })

wss.on('listening', () => {
  console.log(`\x1b[32m[sos-ws]\x1b[0m ws://localhost:${PORT}`)
})

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress ?? 'unknown'
  console.log(`\x1b[36m[sos-ws]\x1b[0m connect ${ip}`)

  /** @type {ReturnType<typeof setInterval> | null} */
  let timer = null

  ws.on('message', (raw) => {
    let data
    try {
      data = JSON.parse(String(raw))
    } catch {
      return
    }
    if (data.type !== 'sos_start') return
    const lat = Number(data.lat)
    const lng = Number(data.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    if (timer) clearInterval(timer)

    const user = { lat, lng }
    const start = { lat: lat + 0.007, lng: lng + 0.0055 }
    const maxTicks = 48
    let tick = 0

    const sendTick = () => {
      tick++
      const t = Math.min(1, tick / maxTicks)
      const pos = interpolate(start, user, t)
      const d = haversineM(pos, user)
      const etaSec = Math.max(0, Math.round((1 - t) * 140))
      ws.send(
        JSON.stringify({
          type: 'sos_tick',
          userLat: user.lat,
          userLng: user.lng,
          responderLat: pos.lat,
          responderLng: pos.lng,
          distanceM: Math.round(d),
          etaSec,
          progress: Math.round(t * 1000) / 1000,
          ts: Date.now(),
        }),
      )
      if (tick >= maxTicks) {
        if (timer) clearInterval(timer)
        timer = null
      }
    }

    sendTick()
    timer = setInterval(() => {
      if (ws.readyState !== ws.OPEN) {
        if (timer) clearInterval(timer)
        return
      }
      sendTick()
    }, 420)
  })

  ws.on('close', () => {
    if (timer) clearInterval(timer)
    console.log(`\x1b[33m[sos-ws]\x1b[0m close`)
  })
  ws.on('error', () => {
    if (timer) clearInterval(timer)
  })
})
