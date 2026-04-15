import { Construction, HardHat, MapPin, Route } from 'lucide-react'
import { useMemo } from 'react'

import { useCommuteLocations } from '@/context/CommuteLocationsContext'
import { buildCorridorConstructionHints } from '@/lib/commute/routeCorridorHints'
import { useCommuteDrivingRoute } from '@/context/CommuteDrivingRouteContext'
import { cn } from '@/lib/utils'

const KIND_ICON = {
  construction: Construction,
  diversion: Route,
  night_work: HardHat,
  new_driver: MapPin,
} as const

/**
 * Between From and To: demo “construction / new driver” notices along the corridor.
 * Straight chord before routes are calculated; snaps to OSRM driving polyline after Calculate.
 */
export function RouteCorridorHintsPanel() {
  const { from, to } = useCommuteLocations()
  const { drivingCoordinates } = useCommuteDrivingRoute()

  const hints = useMemo(
    () => buildCorridorConstructionHints(from, to, drivingCoordinates),
    [from, to, drivingCoordinates],
  )

  const refined = drivingCoordinates && drivingCoordinates.length >= 2

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-4 py-4 md:px-5 md:py-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/35 bg-amber-500/15">
          <Construction className="size-5 text-amber-400" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-sm font-semibold text-amber-100">Along your route · construction & caution (demo)</h3>
          <p className="text-xs leading-relaxed text-amber-100/65">
            We don&apos;t have city-wide live construction feeds in this hackathon build — these are{' '}
            <strong className="text-amber-100/90">simulated</strong> heads-up points between{' '}
            <strong className="text-white/90">A → B</strong> so new drivers aren&apos;t surprised by cones, diversions, or
            messy merge zones. Always verify signage on the ground.
          </p>
          <p className="text-[10px] text-amber-200/45">
            Geometry: {refined ? 'aligned to your last driving path (OSRM)' : 'straight chord until you calculate routes'}
          </p>
        </div>
      </div>

      <ol className="mt-4 space-y-3 border-t border-amber-500/15 pt-4">
        {hints.map((h, i) => {
          const Icon = KIND_ICON[h.kind] ?? Construction
          return (
            <li
              key={h.id}
              className="flex gap-3 rounded-lg border border-white/6 bg-black/35 px-3 py-2.5 text-xs text-white/85"
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] text-amber-200/90',
                  'border border-amber-500/30 bg-amber-500/10',
                )}
                aria-hidden
              >
                {i + 1}
              </span>
              <Icon className="mt-0.5 size-4 shrink-0 text-amber-400/90" aria-hidden />
              <div className="min-w-0">
                <p className="font-medium text-amber-50/95">{h.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{h.detail}</p>
                <p className="mt-1 font-mono text-[9px] text-white/35">
                  ~{h.lat.toFixed(4)}, {h.lng.toFixed(4)}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
