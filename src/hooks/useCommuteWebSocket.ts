import { useEffect, useRef, useState } from 'react'

import type { CorridorSensors } from '@/lib/congestionEngine'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3333'

const MAX_FEED = 80
const RECONNECT_DELAY_MS = 4000

export interface TrafficRouteEvent {
  ts: number
  message: string
  preferAlternate?: boolean
  profile?: 'driving' | 'walking' | 'cycling'
}

export type WsStatus = 'idle' | 'connecting' | 'open' | 'closed' | 'error'

export interface FeedLine {
  ts: number
  text: string
}

function appendFeed(prev: FeedLine[], line: FeedLine): FeedLine[] {
  const next = prev.length >= MAX_FEED ? prev.slice(-(MAX_FEED - 1)) : prev
  return [...next, line]
}

interface WsMsg {
  type?: string
  message?: string
  ts?: number
  preferAlternate?: boolean
  profile?: string
  corridors?: CorridorSensors[]
}

/**
 * Commute stack: corridor sensor snapshots (~30s) + optional route hints for OSRM tab.
 */
export function useCommuteWebSocket(enabled: boolean) {
  const [status, setStatus] = useState<WsStatus>('idle')
  const [corridors, setCorridors] = useState<CorridorSensors[]>([])
  const [lastSnapshotTs, setLastSnapshotTs] = useState<number | null>(null)
  const [feed, setFeed] = useState<FeedLine[]>([])
  const [trafficRouteEvent, setTrafficRouteEvent] = useState<TrafficRouteEvent | null>(null)
  const lastTrafficTs = useRef(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) {
      wsRef.current?.close()
      wsRef.current = null
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
      setStatus('idle')
      return
    }

    function connect() {
      if (!enabledRef.current) return
      setStatus('connecting')
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => setStatus('open')
      ws.onclose = () => {
        setStatus('closed')
        wsRef.current = null
        if (enabledRef.current) {
          reconnectRef.current = setTimeout(connect, RECONNECT_DELAY_MS)
        }
      }
      ws.onerror = () => setStatus('error')

      ws.onmessage = (ev) => {
        let msg: WsMsg
        try {
          msg = JSON.parse(ev.data as string)
        } catch {
          return
        }
        const ts = msg.ts ?? Date.now()

        if (msg.type === 'corridor_snapshot' && Array.isArray(msg.corridors)) {
          const list = msg.corridors
          setCorridors(list)
          setLastSnapshotTs(ts)
          setFeed((f) =>
            appendFeed(f, {
              ts,
              text: `Sensor snapshot · ${list.length} corridors`,
            }),
          )
          return
        }

        if (msg.type === 'traffic_route') {
          if (ts !== lastTrafficTs.current) {
            lastTrafficTs.current = ts
            setTrafficRouteEvent({
              ts,
              message: msg.message ?? 'Route update',
              preferAlternate: Boolean(msg.preferAlternate),
              profile:
                msg.profile === 'walking' || msg.profile === 'cycling'
                  ? msg.profile
                  : 'driving',
            })
          }
          setFeed((f) =>
            appendFeed(f, { ts, text: `[Route] ${msg.message ?? 'update'}` }),
          )
          return
        }

        if (msg.type === 'connected') {
          setFeed((f) => appendFeed(f, { ts, text: msg.message ?? 'Connected' }))
        }
      }
    }

    connect()
    return () => {
      wsRef.current?.close()
      wsRef.current = null
      if (reconnectRef.current) clearTimeout(reconnectRef.current)
    }
  }, [enabled])

  return { status, corridors, lastSnapshotTs, feed, trafficRouteEvent } as const
}
