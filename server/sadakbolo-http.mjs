/**
 * SadakBolo demo HTTP API — in-memory complaint store + CORS.
 * Port: SADAK_HTTP_PORT (default 3456)
 *
 * GET  /api/sadakbolo/complaints  → JSON array
 * POST /api/sadakbolo/complaints  → append body JSON, return { ok: true }
 */

import http from 'node:http'

const PORT = Number(process.env.SADAK_HTTP_PORT || 3456)
/** @type {unknown[]} */
const complaints = []

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...corsHeaders(),
  })
  res.end(body)
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders())
    res.end()
    return
  }

  const url = req.url?.split('?')[0] ?? ''
  if (url !== '/api/sadakbolo/complaints') {
    sendJson(res, 404, { error: 'not_found' })
    return
  }

  if (req.method === 'GET') {
    sendJson(res, 200, complaints)
    return
  }

  if (req.method === 'POST') {
    let raw = ''
    req.on('data', (c) => {
      raw += c
    })
    req.on('end', () => {
      try {
        const item = JSON.parse(raw || '{}')
        complaints.push(item)
        sendJson(res, 200, { ok: true })
      } catch {
        sendJson(res, 400, { error: 'invalid_json' })
      }
    })
    return
  }

  sendJson(res, 405, { error: 'method_not_allowed' })
})

server.listen(PORT, () => {
  console.log(`\x1b[32m[sadakbolo-http]\x1b[0m http://localhost:${PORT}/api/sadakbolo/complaints`)
})
