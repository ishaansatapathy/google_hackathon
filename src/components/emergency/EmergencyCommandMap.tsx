import { useEffect, useRef, useState } from 'react'

import {
  BANGALORE_POLICE_STATIONS,
  stationById,
} from '@/lib/emergency/bangalorePoliceStations'
import {
  BANGALORE_RISK_ZONES,
  BANGALORE_SECURITY_CHECKPOINTS,
  type ZoneLevel,
} from '@/lib/emergency/bangaloreRiskZones'
import { clearGmOverlays, gmFitBounds, type GmOverlay } from '@/lib/googleMapsHelpers'
import { hasGoogleMapsApiKey, loadGoogleMaps } from '@/lib/googleMapsLoader'
import type { SosSession, SosTracePayload } from '@/lib/sos/types'

const ZONE_COLORS: Record<ZoneLevel, { stroke: string; fill: string; weight: number }> = {
  high: { stroke: '#b91c1c', fill: '#dc2626', weight: 2 },
  medium: { stroke: '#c2410c', fill: '#ea580c', weight: 2 },
  low: { stroke: '#15803d', fill: '#22c55e', weight: 1 },
}

type Props = {
  sessions: SosSession[]
  traceEvent: SosTracePayload | null
  traceSeq: number
  selectedStationId: string
  congestionIndex: number
  riskZonesVisible: boolean
}

export function EmergencyCommandMap({
  sessions,
  traceEvent,
  traceSeq,
  selectedStationId,
  congestionIndex,
  riskZonesVisible,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const riskOverlaysRef = useRef<GmOverlay[]>([])
  const securityOverlaysRef = useRef<GmOverlay[]>([])
  const stationOverlaysRef = useRef<GmOverlay[]>([])
  const sessionOverlaysRef = useRef<GmOverlay[]>([])
  const traceOverlaysRef = useRef<GmOverlay[]>([])
  const timersRef = useRef<number[]>([])
  const traceFadeTimerRef = useRef<number | null>(null)
  const didFitSessionsRef = useRef(false)
  const [mapEpoch, setMapEpoch] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    if (!hasGoogleMapsApiKey()) {
      el.innerHTML =
        '<div class="flex h-full items-center justify-center bg-zinc-900 p-4 text-center text-sm text-amber-200/90">Maps key missing — set <code class="mx-1 rounded bg-black/40 px-1">VITE_GOOGLE_MAPS_API_KEY</code> in <code class="mx-1 rounded bg-black/40 px-1">.env.local</code> (dev) or <code class="mx-1 rounded bg-black/40 px-1">GOOGLE_MAPS_API_KEY</code> on Cloud Run (prod).</div>'
      return
    }

    let cancelled = false
    let ro: ResizeObserver | null = null
    let t1 = 0
    let t2 = 0

    void loadGoogleMaps().then((g) => {
      if (cancelled || !el) return

      const blPoints = BANGALORE_POLICE_STATIONS.map((s) => ({ lat: s.lat, lng: s.lng }))
      const bounds = new g.maps.LatLngBounds()
      blPoints.forEach((p) => bounds.extend(p))

      const map = new g.maps.Map(el, {
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      })
      map.fitBounds(bounds, 48)
      mapRef.current = map
      setMapEpoch((n) => n + 1)

      for (const cp of BANGALORE_SECURITY_CHECKPOINTS) {
        const m = new g.maps.Marker({
          position: { lat: cp.lat, lng: cp.lng },
          map,
          title: cp.label,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            fillColor: '#6366f1',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
          },
        })
        securityOverlaysRef.current.push(m)
      }

      for (const st of BANGALORE_POLICE_STATIONS) {
        const m = new g.maps.Marker({
          position: { lat: st.lat, lng: st.lng },
          map,
          title: st.name,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            fillColor: '#16a34a',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 6,
          },
        })
        stationOverlaysRef.current.push(m)
      }

      ro = new ResizeObserver(() => {
        if (mapRef.current) g.maps.event.trigger(mapRef.current, 'resize')
      })
      ro.observe(el)
      t1 = window.setTimeout(() => g.maps.event.trigger(map, 'resize'), 100)
      t2 = window.setTimeout(() => g.maps.event.trigger(map, 'resize'), 400)
    })

    return () => {
      cancelled = true
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      ro?.disconnect()
      clearGmOverlays(riskOverlaysRef.current)
      clearGmOverlays(securityOverlaysRef.current)
      clearGmOverlays(stationOverlaysRef.current)
      clearGmOverlays(sessionOverlaysRef.current)
      clearGmOverlays(traceOverlaysRef.current)
      if (traceFadeTimerRef.current) {
        window.clearTimeout(traceFadeTimerRef.current)
        traceFadeTimerRef.current = null
      }
      mapRef.current = null
      didFitSessionsRef.current = false
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.google?.maps) return

    clearGmOverlays(riskOverlaysRef.current)
    if (!riskZonesVisible) return

    const intensity = 0.08 + 0.22 * (congestionIndex / 100)

    for (const z of BANGALORE_RISK_ZONES) {
      const c = ZONE_COLORS[z.level]
      const levelBoost = z.level === 'high' ? 1.15 : z.level === 'medium' ? 1 : 0.85
      const fillOpacity = Math.min(0.42, intensity * levelBoost * (z.level === 'high' ? 1.15 : 1))

      const circle = new google.maps.Circle({
        center: { lat: z.lat, lng: z.lng },
        radius: z.radiusM,
        strokeColor: c.stroke,
        strokeWeight: c.weight,
        strokeOpacity: 0.92,
        fillColor: c.fill,
        fillOpacity,
        map,
      })
      circle.set('title', `${z.label} (${z.level})`)
      riskOverlaysRef.current.push(circle)
    }
  }, [mapEpoch, riskZonesVisible, congestionIndex])

  useEffect(() => {
    const map = mapRef.current
    const s = stationById(selectedStationId)
    if (!map || !s) return
    map.panTo({ lat: s.lat, lng: s.lng })
    map.setZoom(14)
  }, [mapEpoch, selectedStationId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    clearGmOverlays(sessionOverlaysRef.current)
    const withCoords = sessions.filter((s) => s.lat != null && s.lng != null)
    const bounds = new google.maps.LatLngBounds()

    for (const s of withCoords) {
      const lat = s.lat as number
      const lng = s.lng as number
      bounds.extend({ lat, lng })
      const m = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: s.id,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#dc2626',
          fillOpacity: 0.95,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 10,
        },
        zIndex: 500,
      })
      sessionOverlaysRef.current.push(m)
    }

    if (withCoords.length === 1) {
      const p = withCoords[0]
      map.panTo({ lat: p.lat as number, lng: p.lng as number })
      map.setZoom(14)
      didFitSessionsRef.current = true
    } else if (withCoords.length > 1) {
      map.fitBounds(bounds, 48)
      didFitSessionsRef.current = true
    } else if (didFitSessionsRef.current && withCoords.length === 0) {
      const blPoints = BANGALORE_POLICE_STATIONS.map((s) => ({ lat: s.lat, lng: s.lng }))
      gmFitBounds(map, blPoints, 48)
      didFitSessionsRef.current = false
    }
  }, [mapEpoch, sessions])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !traceEvent) return

    for (const id of timersRef.current) window.clearTimeout(id)
    timersRef.current = []

    const { session, phase, peerTargets, ringTargets } = traceEvent
    if (session.lat == null || session.lng == null) return

    const origin = { lat: session.lat, lng: session.lng }

    if (phase === 'nearest') {
      clearGmOverlays(traceOverlaysRef.current)
      if (traceFadeTimerRef.current) {
        window.clearTimeout(traceFadeTimerRef.current)
        traceFadeTimerRef.current = null
      }
      traceFadeTimerRef.current = window.setTimeout(() => {
        clearGmOverlays(traceOverlaysRef.current)
        traceFadeTimerRef.current = null
      }, 60000)
    }

    const drawLine = (
      dest: { lat: number; lng: number },
      opts: { color: string; weight: number; delay: number },
    ) => {
      const id = window.setTimeout(() => {
        const path = [origin, { lat: dest.lat, lng: dest.lng }]
        const line = new google.maps.Polyline({
          path,
          strokeColor: opts.color,
          strokeWeight: opts.weight,
          strokeOpacity: 0.15,
          map,
        })

        traceOverlaysRef.current.push(line)

        let step = 0
        const tick = () => {
          step += 1
          const o = Math.min(1, 0.15 + step * 0.12)
          line.setOptions({ strokeOpacity: o })
          if (o < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)

        const endDot = new google.maps.Circle({
          center: { lat: dest.lat, lng: dest.lng },
          radius: 55,
          strokeColor: opts.color,
          strokeWeight: 2,
          fillColor: '#0a1628',
          fillOpacity: 0.9,
          map,
        })
        traceOverlaysRef.current.push(endDot)
      }, opts.delay)
      timersRef.current.push(id)
    }

    if (phase === 'nearest' && peerTargets?.length) {
      peerTargets.forEach((p, i) => {
        drawLine(p, { color: '#16a34a', weight: 3, delay: 80 + i * 220 })
      })
      const originPulse = new google.maps.Circle({
        center: origin,
        radius: 140,
        strokeColor: '#dc2626',
        strokeWeight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.35,
        map,
      })
      traceOverlaysRef.current.push(originPulse)
    }

    if (phase === 'mesh_expand' && ringTargets?.length) {
      ringTargets.forEach((p, i) => {
        drawLine(p, { color: '#d97706', weight: 2, delay: 60 + i * 140 })
      })
    }

    return () => {
      for (const tid of timersRef.current) window.clearTimeout(tid)
      timersRef.current = []
    }
  }, [mapEpoch, traceEvent, traceSeq])

  return (
    <>
      <div
        ref={wrapRef}
        className="z-0 h-full min-h-[420px] w-full bg-[#dbe7e4]"
      />
    </>
  )
}
