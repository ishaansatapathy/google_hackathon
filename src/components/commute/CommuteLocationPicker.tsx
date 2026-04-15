import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { Crosshair, MapPin, Navigation } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCommuteLocations } from '@/context/CommuteLocationsContext'
import { formatCoordsShort } from '@/lib/geoMetro'

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function markerHtml(label: string, bg: string) {
  return `<div style="width:28px;height:28px;border-radius:50%;background:${bg};color:#fff;font:bold 11px/28px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45)">${label}</div>`
}

export function CommuteLocationPicker() {
  const {
    from,
    to,
    setFrom,
    setTo,
    pickMode,
    setPickMode,
    setFromGeolocation,
    geoError,
    clearGeoError,
  } = useCommuteLocations()

  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const pickModeRef = useRef(pickMode)
  const setFromRef = useRef(setFrom)
  const setToRef = useRef(setTo)
  const setPickModeRef = useRef(setPickMode)
  /** After "My location", fly to A instead of zooming out to fit A+B (often very far apart). */
  const focusFromAfterGeoRef = useRef(false)

  pickModeRef.current = pickMode
  setFromRef.current = setFrom
  setToRef.current = setTo
  setPickModeRef.current = setPickMode

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    const map = L.map(el, { zoomControl: true }).setView([(from.lat + to.lat) / 2, (from.lng + to.lng) / 2], 12)
    mapRef.current = map
    L.tileLayer(OSM, { maxZoom: 19, attribution: '© OSM' }).addTo(map)
    markersRef.current = L.layerGroup().addTo(map)

    map.on('click', (e: L.LeafletMouseEvent) => {
      const mode = pickModeRef.current
      if (mode === 'from') {
        setFromRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
        setPickModeRef.current('none')
      } else if (mode === 'to') {
        setToRef.current({ lat: e.latlng.lat, lng: e.latlng.lng })
        setPickModeRef.current('none')
      }
    })

    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    const t = window.setTimeout(() => map.invalidateSize(), 280)

    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [])

  useEffect(() => {
    if (geoError) focusFromAfterGeoRef.current = false
  }, [geoError])

  useEffect(() => {
    const map = mapRef.current
    const g = markersRef.current
    if (!map || !g) return
    g.clearLayers()

    const iconA = L.divIcon({
      className: 'commute-pin-icon',
      html: markerHtml('A', '#EE3F2C'),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })
    const iconB = L.divIcon({
      className: 'commute-pin-icon',
      html: markerHtml('B', '#2563eb'),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    L.marker([from.lat, from.lng], { icon: iconA }).addTo(g).bindPopup('From (start)')
    L.marker([to.lat, to.lng], { icon: iconB }).addTo(g).bindPopup('To (destination)')

    if (focusFromAfterGeoRef.current) {
      focusFromAfterGeoRef.current = false
      const run = () => {
        map.invalidateSize()
        map.flyTo([from.lat, from.lng], 16, {
          duration: 0.85,
          easeLinearity: 0.22,
        })
      }
      requestAnimationFrame(run)
      return
    }

    const bounds = L.latLngBounds([from.lat, from.lng], [to.lat, to.lng])
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 14 })
  }, [from, to])

  return (
    <section
      id="commute-trip-endpoints"
      aria-labelledby="trip-endpoints-title"
      className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start gap-3">
        <Navigation className="mt-0.5 size-5 shrink-0 text-[#EE3F2C]" aria-hidden />
        <div>
          <h3 id="trip-endpoints-title" className="text-sm font-semibold text-white">
            Trip endpoints
          </h3>
          <p className="mt-1 text-xs text-white/55">
            Set <strong className="text-white/80">From</strong> with your location or tap the map;
            set <strong className="text-white/80">Where</strong> by pinning. Same points power{' '}
            <strong className="text-white/90">Congestion</strong> and <strong className="text-white/90">Routes</strong>.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#EE3F2C]">
            From
          </p>
          <p className="mt-1 font-mono text-xs text-white/85">{formatCoordsShort(from)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-white/20 text-white"
              onClick={() => {
                clearGeoError()
                focusFromAfterGeoRef.current = true
                setFromGeolocation()
              }}
            >
              <MapPin className="mr-1.5 size-3.5" />
              My location
            </Button>
            <Button
              type="button"
              size="sm"
              variant={pickMode === 'from' ? 'default' : 'outline'}
              className={
                pickMode === 'from'
                  ? 'bg-emerald-700 text-white'
                  : 'border-white/20 text-white'
              }
              onClick={() => setPickMode(pickMode === 'from' ? 'none' : 'from')}
            >
              <Crosshair className="mr-1.5 size-3.5" />
              {pickMode === 'from' ? 'Click map…' : 'Pin on map'}
            </Button>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Where</p>
          <p className="mt-1 font-mono text-xs text-white/85">{formatCoordsShort(to)}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={pickMode === 'to' ? 'default' : 'outline'}
              className={
                pickMode === 'to'
                  ? 'bg-blue-700 text-white'
                  : 'border-white/20 text-white'
              }
              onClick={() => setPickMode(pickMode === 'to' ? 'none' : 'to')}
            >
              <Crosshair className="mr-1.5 size-3.5" />
              {pickMode === 'to' ? 'Click map…' : 'Pin on map'}
            </Button>
          </div>
        </div>
      </div>

      {geoError ? (
        <p className="mt-2 text-xs text-amber-300/95" role="alert">
          {geoError}
        </p>
      ) : null}

      {pickMode !== 'none' && (
        <p className="mt-3 text-xs text-emerald-200/90">
          Tap the map once to place point <strong>{pickMode === 'from' ? 'A (From)' : 'B (Where)'}</strong>.
        </p>
      )}

      <div
        ref={elRef}
        className="relative z-0 mt-4 h-[min(38vh,320px)] min-h-[200px] w-full overflow-hidden rounded-lg border border-white/10"
      />
    </section>
  )
}
