import { useEffect, useRef, useState } from 'react'
import { Crosshair, MapPin, Navigation } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCommuteLocations } from '@/context/CommuteLocationsContext'
import { formatCoordsShort } from '@/lib/geoMetro'
import { gmFitBounds } from '@/lib/googleMapsHelpers'
import { hasGoogleMapsApiKey, loadGoogleMaps } from '@/lib/googleMapsLoader'

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
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerARef = useRef<google.maps.Marker | null>(null)
  const markerBRef = useRef<google.maps.Marker | null>(null)
  const pickModeRef = useRef(pickMode)
  const setFromRef = useRef(setFrom)
  const setToRef = useRef(setTo)
  const setPickModeRef = useRef(setPickMode)
  const focusFromAfterGeoRef = useRef(false)
  const [mapEpoch, setMapEpoch] = useState(0)

  pickModeRef.current = pickMode
  setFromRef.current = setFrom
  setToRef.current = setTo
  setPickModeRef.current = setPickMode

  useEffect(() => {
    const el = elRef.current
    if (!el) return

    if (!hasGoogleMapsApiKey()) {
      el.innerHTML =
        '<div class="flex h-full items-center justify-center bg-zinc-900 p-3 text-center text-[11px] text-amber-200/90">Maps key — .env.local or Cloud Run <code class="mx-1 rounded bg-black/40 px-1">GOOGLE_MAPS_API_KEY</code>.</div>'
      return
    }

    let cancelled = false
    let clickListener: google.maps.MapsEventListener | null = null
    let ro: ResizeObserver | null = null

    void loadGoogleMaps().then((g) => {
      if (cancelled || !el) return

      const map = new g.maps.Map(el, {
        center: { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 },
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
      mapRef.current = map
      setMapEpoch((n) => n + 1)

      const ma = new g.maps.Marker({
        map,
        label: { text: 'A', color: 'white', fontWeight: 'bold' },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          fillColor: '#EE3F2C',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 12,
        },
      })
      const mb = new g.maps.Marker({
        map,
        label: { text: 'B', color: 'white', fontWeight: 'bold' },
        icon: {
          path: g.maps.SymbolPath.CIRCLE,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          scale: 12,
        },
      })
      markerARef.current = ma
      markerBRef.current = mb

      clickListener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
        const ll = e.latLng
        if (!ll) return
        const mode = pickModeRef.current
        const lat = ll.lat()
        const lng = ll.lng()
        if (mode === 'from') {
          setFromRef.current({ lat, lng })
          setPickModeRef.current('none')
        } else if (mode === 'to') {
          setToRef.current({ lat, lng })
          setPickModeRef.current('none')
        }
      })

      ro = new ResizeObserver(() => {
        if (mapRef.current) g.maps.event.trigger(mapRef.current, 'resize')
      })
      ro.observe(el)
      window.setTimeout(() => g.maps.event.trigger(map, 'resize'), 280)
    })

    return () => {
      cancelled = true
      clickListener?.remove()
      ro?.disconnect()
      markerARef.current?.setMap(null)
      markerBRef.current?.setMap(null)
      markerARef.current = null
      markerBRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    if (geoError) focusFromAfterGeoRef.current = false
  }, [geoError])

  useEffect(() => {
    const map = mapRef.current
    const ma = markerARef.current
    const mb = markerBRef.current
    if (!map || !ma || !mb) return

    ma.setPosition({ lat: from.lat, lng: from.lng })
    ma.setTitle('From (start)')
    mb.setPosition({ lat: to.lat, lng: to.lng })
    mb.setTitle('To (destination)')

    if (focusFromAfterGeoRef.current) {
      focusFromAfterGeoRef.current = false
      map.panTo({ lat: from.lat, lng: from.lng })
      map.setZoom(16)
      return
    }

    gmFitBounds(map, [
      { lat: from.lat, lng: from.lng },
      { lat: to.lat, lng: to.lng },
    ], 28)
  }, [from, to, mapEpoch])

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
