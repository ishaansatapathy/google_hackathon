import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import {
  Bike,
  Car,
  Footprints,
  Loader2,
  Navigation,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SadakBolo } from '@/components/sadakbolo/SadakBolo'
import { useCommuteLocations } from '@/context/CommuteLocationsContext'
import { fetchComplaints } from '@/lib/sadakbolo/api'
import type { SadakReport } from '@/lib/sadakbolo/types'
import type { TrafficRouteEvent } from '@/hooks/useCommuteWebSocket'
import {
  countNearSeverity,
  mergeRisksForModes,
  type RiskKind,
  type SimulatedRisk,
} from '@/lib/routeRiskSimulation'
import {
  fetchDrivingAlternatives,
  fetchRoute,
  formatDistance,
  formatDuration,
  getRouteDisplayMetrics,
  type RouteLeg,
} from '@/lib/osrmRoutes'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

const COLORS = {
  walking: '#22c55e',
  cycling: '#3b82f6',
  'driving-primary': '#f59e0b',
  'driving-alt': '#94a3b8',
} as const

function riskMarkerHtml(kind: RiskKind): string {
  const bg =
    kind === 'accident' ? '#ef4444' : kind === 'traffic' ? '#f59e0b' : '#64748b'
  return `<div class="risk-marker-pulse" style="--risk-bg:${bg}"></div>`
}

type RoutesTabProps = {
  trafficRouteEvent: TrafficRouteEvent | null
  isActive: boolean
}

export function RoutesTab({ trafficRouteEvent, isActive }: RoutesTabProps) {
  const { from, to } = useCommuteLocations()

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const routeLayerRef = useRef<L.LayerGroup | null>(null)
  const riskLayerRef = useRef<L.LayerGroup | null>(null)
  const sadakComplaintsLayerRef = useRef<L.LayerGroup | null>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [walk, setWalk] = useState<RouteLeg | null>(null)
  const [bike, setBike] = useState<RouteLeg | null>(null)
  const [driveLegs, setDriveLegs] = useState<RouteLeg[]>([])
  const [activeDriveIndex, setActiveDriveIndex] = useState(0)

  const [riskBundle, setRiskBundle] = useState<{
    walk: SimulatedRisk[]
    bike: SimulatedRisk[]
    drive: SimulatedRisk[]
  }>({ walk: [], bike: [], drive: [] })

  const [sadakReports, setSadakReports] = useState<SadakReport[]>([])

  const lastTrafficTs = useRef<number>(0)
  const pendingAlternateRef = useRef(false)

  useEffect(() => {
    if (!trafficRouteEvent) return
    if (trafficRouteEvent.ts === lastTrafficTs.current) return
    lastTrafficTs.current = trafficRouteEvent.ts
    if (trafficRouteEvent.preferAlternate) {
      if (driveLegs.length > 1) setActiveDriveIndex(1)
      else pendingAlternateRef.current = true
    }
  }, [trafficRouteEvent, driveLegs.length])

  useEffect(() => {
    if (pendingAlternateRef.current && driveLegs.length > 1) {
      setActiveDriveIndex(1)
      pendingAlternateRef.current = false
    }
  }, [driveLegs])

  useEffect(() => {
    void fetchComplaints().then(setSadakReports)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const map = L.map(el, { zoomControl: true }).setView([from.lat, from.lng], 12)
    mapRef.current = map
    L.tileLayer(OSM_URL, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)
    routeLayerRef.current = L.layerGroup().addTo(map)
    riskLayerRef.current = L.layerGroup().addTo(map)
    sadakComplaintsLayerRef.current = L.layerGroup().addTo(map)

    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    const t = window.setTimeout(() => map.invalidateSize(), 200)

    return () => {
      window.clearTimeout(t)
      ro.disconnect()
      map.remove()
      mapRef.current = null
      routeLayerRef.current = null
      riskLayerRef.current = null
      sadakComplaintsLayerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!isActive || !mapRef.current) return
    const id = requestAnimationFrame(() => mapRef.current?.invalidateSize())
    const t = window.setTimeout(() => mapRef.current?.invalidateSize(), 150)
    return () => {
      cancelAnimationFrame(id)
      window.clearTimeout(t)
    }
  }, [isActive])

  const drawRoutes = useCallback(
    (
      w: RouteLeg | null,
      b: RouteLeg | null,
      drives: RouteLeg[],
      highlightDrive: number,
      risks: { walk: SimulatedRisk[]; bike: SimulatedRisk[]; drive: SimulatedRisk[] },
    ) => {
      const group = routeLayerRef.current
      const riskG = riskLayerRef.current
      const map = mapRef.current
      if (!group || !map || !riskG) return
      group.clearLayers()
      riskG.clearLayers()

      L.marker([from.lat, from.lng]).bindPopup('From').addTo(group)
      L.marker([to.lat, to.lng]).bindPopup('To').addTo(group)

      const addLine = (
        leg: RouteLeg,
        color: string,
        weight: number,
        dash: string | undefined,
        opacity: number,
      ) => {
        if (leg.coordinates.length < 2) return
        L.polyline(leg.coordinates, {
          color,
          weight,
          opacity,
          dashArray: dash,
        }).addTo(group)
      }

      if (w) addLine(w, COLORS.walking, 5, undefined, 0.82)
      if (b) addLine(b, COLORS.cycling, 5, '8 6', 0.82)

      drives.forEach((leg, i) => {
        const isActiveLeg = i === highlightDrive
        const color = i === 0 ? COLORS['driving-primary'] : COLORS['driving-alt']
        const weight = isActiveLeg ? 7 : 4
        const op = isActiveLeg ? 0.94 : 0.42
        const dash = i === 0 ? undefined : '10 8'
        addLine(leg, color, weight, dash, op)
      })

      const primaryDrive = drives[0]
      const driveRisks = primaryDrive ? risks.drive : []
      const displayRisks = driveRisks.length ? driveRisks : [...risks.walk, ...risks.bike].slice(0, 5)

      displayRisks.forEach((r) => {
        const icon = L.divIcon({
          className: 'risk-risk-icon',
          html: riskMarkerHtml(r.kind),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })
        L.marker([r.lat, r.lng], { icon })
          .bindPopup(`<strong>${r.label}</strong><br/><span style="font-size:11px">Severity ~${r.severityScore}</span>`)
          .addTo(riskG)
      })

      const bounds = L.latLngBounds([from.lat, from.lng], [to.lat, to.lng])
      ;[w, b, ...drives].forEach((leg) => {
        if (leg?.coordinates.length) bounds.extend(leg.coordinates)
      })
      displayRisks.forEach((r) => bounds.extend([r.lat, r.lng]))
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    },
    [from, to],
  )

  useEffect(() => {
    drawRoutes(walk, bike, driveLegs, activeDriveIndex, riskBundle)
  }, [walk, bike, driveLegs, activeDriveIndex, riskBundle, drawRoutes])

  useEffect(() => {
    const layer = sadakComplaintsLayerRef.current
    if (!layer) return
    layer.clearLayers()
    sadakReports.forEach((r) => {
      const hue = r.severity >= 8 ? '#ef4444' : r.severity >= 5 ? '#f59e0b' : '#22c55e'
      const icon = L.divIcon({
        className: 'report-marker-icon',
        html: `<div class="report-marker-dot" style="background:${hue}"/>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })
      L.marker([r.lat, r.lng], { icon })
        .bindPopup(
          `<strong>SadakBolo</strong><br/>${String(r.type).replace('_', ' ')} · ${r.severity}/10 · ${r.priority}<br/><span style="font-size:11px">${new Date(r.timestamp).toLocaleString()}</span>`,
        )
        .addTo(layer)
    })
  }, [sadakReports])

  async function calculateRoutes() {
    setError(null)
    setLoading(true)
    setWalk(null)
    setBike(null)
    setDriveLegs([])
    setActiveDriveIndex(0)
    setRiskBundle({ walk: [], bike: [], drive: [] })

    try {
      const [w, c, drives] = await Promise.all([
        fetchRoute('walking', from, to),
        fetchRoute('cycling', from, to),
        fetchDrivingAlternatives(from, to),
      ])

      let dLegs = drives
      if (dLegs.length === 0) {
        const single = await fetchRoute('driving', from, to)
        dLegs = single ? [single] : []
      }

      setWalk(w)
      setBike(c)
      setDriveLegs(dLegs)

      const merged = mergeRisksForModes(w, c, dLegs[0] ?? null)
      setRiskBundle(merged)

      if (!w && !c && dLegs.length === 0) {
        setError('Could not fetch routes. Try pins closer to drivable roads (OSRM demo).')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Route request failed')
    } finally {
      setLoading(false)
    }
  }

  const driveActive = driveLegs[activeDriveIndex] ?? driveLegs[0] ?? null

  const reportLat = (from.lat + to.lat) / 2
  const reportLng = (from.lng + to.lng) / 2
  const reportLabel = 'Midpoint of your From → To route (demo anchor)'

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-white/10 bg-[#0a0a0a] p-4 md:gap-8 md:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <Navigation className="mt-0.5 size-5 shrink-0 text-[#EE3F2C]" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-white">Multi-mode routes</h3>
          <p className="mt-1 text-xs text-white/55">
            Uses <strong className="text-white/80">the same From / To</strong> as the map above. Calculate once — walk, bike, and car
            dashboards update together. Orange/grey rings on the map are <strong className="text-white/80">simulated</strong> incidents / traffic.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={calculateRoutes}
          disabled={loading}
          className="bg-[#EE3F2C] text-white hover:bg-[#d63b28]"
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Navigation className="mr-2 size-4" />
          )}
          Calculate routes (A → B)
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-300/90" role="alert">
          {error}
        </p>
      )}

      {trafficRouteEvent && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/95">
          <strong className="text-amber-200">Live (WS):</strong> {trafficRouteEvent.message}
          {trafficRouteEvent.preferAlternate && driveLegs.length > 1 && (
            <span className="ml-1 text-white/80">— alternate car route highlighted.</span>
          )}
        </div>
      )}

      <div className="relative z-0">
        <div
          ref={containerRef}
          className="h-[min(52vh,480px)] min-h-[320px] w-full overflow-hidden rounded-lg border border-white/10"
        />
        <SadakBolo
          isActive={isActive}
          reportLat={reportLat}
          reportLng={reportLng}
          locationLabel={reportLabel}
          existingReports={sadakReports}
          onSubmitted={(r) => setSadakReports((prev) => [...prev, r])}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/45">
        <ShieldAlert className="size-3.5 text-amber-400/90" />
        Pulsing markers = simulated risk only — not real-time police / civic data. Coloured dots = SadakBolo
        complaints (demo).
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ModeDashboard
          icon={Footprints}
          label="Walk"
          color={COLORS.walking}
          leg={walk}
          risks={riskBundle.walk}
        />
        <ModeDashboard
          icon={Bike}
          label="Bike"
          color={COLORS.cycling}
          leg={bike}
          risks={riskBundle.bike}
        />
        <ModeDashboard
          icon={Car}
          label="Car"
          color={COLORS['driving-primary']}
          leg={driveActive}
          risks={riskBundle.drive}
          subtitle={
            driveLegs.length > 1
              ? `${activeDriveIndex === 0 ? 'Primary' : 'Alternate'} · ${driveLegs.length} driving options`
              : driveLegs.length === 1
                ? 'Single driving path from OSRM'
                : undefined
          }
          extra={
            driveLegs.length > 1 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={activeDriveIndex === 0 ? 'default' : 'outline'}
                  className={
                    activeDriveIndex === 0 ? 'bg-amber-600 text-white' : 'border-white/20 text-white'
                  }
                  onClick={() => setActiveDriveIndex(0)}
                >
                  Primary
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={activeDriveIndex === 1 ? 'default' : 'outline'}
                  className={
                    activeDriveIndex === 1 ? 'bg-slate-600 text-white' : 'border-white/20 text-white'
                  }
                  onClick={() => setActiveDriveIndex(1)}
                >
                  Alternate
                </Button>
              </div>
            ) : null
          }
        />
      </div>

      <p className="text-[10px] text-white/35">
        OSRM public demo · Distance blends route length with mapped geometry when they agree. ETA uses OSRM when
        speeds look realistic for each mode; otherwise typical walk / bike / car speeds. Risk markers are procedural.
      </p>
    </div>
  )
}

function stressScore(leg: RouteLeg | null, risks: SimulatedRisk[]): number {
  if (!leg) return 0
  const { durationS } = getRouteDisplayMetrics(leg)
  const hi = countNearSeverity(risks, 55)
  const base = Math.min(100, durationS / 120 + hi * 12)
  return Math.round(base)
}

function ModeDashboard({
  icon: Icon,
  label,
  color,
  leg,
  risks,
  subtitle,
  extra,
}: {
  icon: LucideIcon
  label: string
  color: string
  leg: RouteLeg | null
  risks: SimulatedRisk[]
  subtitle?: string
  extra?: ReactNode
}) {
  const stress = stressScore(leg, risks)
  const metrics = leg ? getRouteDisplayMetrics(leg) : null
  return (
    <div className="flex flex-col rounded-xl border border-white/10 bg-black/45 p-4">
      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
        <Icon className="size-5 text-white/80" />
        <span className="font-semibold text-white">{label}</span>
      </div>

      {leg && metrics ? (
        <>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-white/70">
              <dt>Distance</dt>
              <dd className="font-mono">{formatDistance(metrics.distanceM)}</dd>
            </div>
            <div className="flex justify-between text-white/70">
              <dt>ETA</dt>
              <dd className="font-mono">{formatDuration(metrics.durationS)}</dd>
            </div>
            <div className="flex justify-between text-white/70">
              <dt>Sim. hazards on path</dt>
              <dd className="font-mono">{risks.length}</dd>
            </div>
            <div className="flex justify-between text-white/70">
              <dt>Route stress</dt>
              <dd className="font-mono">{stress}/100</dd>
            </div>
          </dl>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${stress}%`,
                background:
                  stress > 72 ? 'linear-gradient(90deg,#ef4444,#f97316)' : stress > 45 ? '#f59e0b' : '#22c55e',
              }}
            />
          </div>
          {subtitle && <p className="mt-2 text-[10px] text-white/45">{subtitle}</p>}
          {extra}
          <ul className="mt-3 space-y-1 border-t border-white/8 pt-2 text-[10px] text-white/50">
            {risks.slice(0, 3).map((r) => (
              <li key={`${r.lat}-${r.lng}-${r.kind}`}>
                · {r.label} (~{r.severityScore})
              </li>
            ))}
            {risks.length === 0 ? <li>— no simulated points on this geometry</li> : null}
          </ul>
        </>
      ) : (
        <p className="mt-4 text-sm text-white/40">Run calculate to load {label.toLowerCase()} geometry.</p>
      )}
    </div>
  )
}
