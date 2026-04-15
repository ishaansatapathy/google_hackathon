import { useEffect, useRef, useState } from 'react'

import type { LatLngTuple } from '@/lib/sos/fetchOsrmRoute'
import type { GmOverlay } from '@/lib/googleMapsHelpers'
import { hasGoogleMapsApiKey, loadGoogleMaps } from '@/lib/googleMapsLoader'

const DARK_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
]

type Props = {
  active: boolean
  userLat: number
  userLng: number
  responderLat: number | null
  responderLng: number | null
  responderName?: string
  routeLatLngs?: LatLngTuple[] | null
}

export function SosLiveMap({
  active,
  userLat,
  userLng,
  responderLat,
  responderLng,
  responderName = 'Responder',
  routeLatLngs = null,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<GmOverlay[]>([])
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || !active) return

    if (!hasGoogleMapsApiKey()) {
      el.innerHTML =
        '<div class="flex h-full items-center justify-center bg-[#0a1628] p-2 text-center text-[10px] text-sky-200/80">Maps API key missing (.env.local)</div>'
      return
    }

    let cancelled = false
    void loadGoogleMaps().then(() => {
      if (cancelled || !el) return
      const map = new google.maps.Map(el, {
        center: { lat: userLat, lng: userLng },
        zoom: 14,
        disableDefaultUI: true,
        styles: DARK_STYLES,
      })
      mapRef.current = map
      setEpoch((n) => n + 1)
      const ro = new ResizeObserver(() => google.maps.event.trigger(map, 'resize'))
      ro.observe(el)
      window.setTimeout(() => google.maps.event.trigger(map, 'resize'), 320)
    })

    return () => {
      cancelled = true
      for (const o of overlaysRef.current) o.setMap(null)
      overlaysRef.current = []
      mapRef.current = null
    }
  }, [active])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !active) return

    for (const o of overlaysRef.current) o.setMap(null)
    overlaysRef.current = []

    const u = new google.maps.Marker({
      position: { lat: userLat, lng: userLng },
      map,
      title: 'You',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
        scale: 9,
      },
    })
    overlaysRef.current.push(u)

    if (
      responderLat != null &&
      responderLng != null &&
      Number.isFinite(responderLat) &&
      Number.isFinite(responderLng)
    ) {
      const r = new google.maps.Marker({
        position: { lat: responderLat, lng: responderLng },
        map,
        title: responderName,
        label: { text: responderName.slice(0, 12), color: '#e2e8f0', fontSize: '10px' },
      })
      overlaysRef.current.push(r)

      const path: google.maps.LatLngLiteral[] =
        routeLatLngs && routeLatLngs.length >= 2
          ? routeLatLngs.map(([lat, lng]) => ({ lat, lng }))
          : [
              { lat: responderLat, lng: responderLng },
              { lat: userLat, lng: userLng },
            ]

      const line = new google.maps.Polyline({
        path,
        strokeColor: '#38bdf8',
        strokeWeight: 3,
        strokeOpacity: 0.85,
        map,
      })
      overlaysRef.current.push(line)

      const b = new google.maps.LatLngBounds()
      path.forEach((p) => b.extend(p))
      map.fitBounds(b, 32)
    } else {
      map.panTo({ lat: userLat, lng: userLng })
      map.setZoom(14)
    }
  }, [active, userLat, userLng, responderLat, responderLng, responderName, routeLatLngs, epoch])

  if (!active) return null

  return <div ref={wrapRef} className="sos-live-map h-[220px] w-full overflow-hidden rounded-xl border border-white/12 bg-[#0a1628]" />
}
