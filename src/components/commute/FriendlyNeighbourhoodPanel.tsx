import { useCallback, useEffect, useMemo, useState } from 'react'
import { Car, Clock, Loader2, RefreshCw, Send, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useCommuteLocations } from '@/context/CommuteLocationsContext'
import { formatCoordsShort } from '@/lib/geoMetro'
import { simulateNeighbourhoodMatches } from '@/lib/neighbourhoodRideSimulation'

const REFRESH_MS = 18_000

export function FriendlyNeighbourhoodPanel() {
  const { from, to } = useCommuteLocations()
  const [tick, setTick] = useState(0)
  const [requestingId, setRequestingId] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  const matches = useMemo(
    () => simulateNeighbourhoodMatches(from, to, tick),
    [from, to, tick],
  )

  useEffect(() => {
    const t = window.setInterval(() => setTick((x) => x + 1), REFRESH_MS)
    return () => window.clearInterval(t)
  }, [])

  const onRequest = useCallback((id: string, label: string) => {
    setRequestingId(id)
    setBanner(null)
    window.setTimeout(() => {
      setRequestingId(null)
      setBanner(
        `Ride request sent (sim) — ${label} will see your A→B overlap. They can accept or decline in a real build.`,
      )
      window.setTimeout(() => setBanner(null), 6500)
    }, 900)
  }, [])

  return (
    <section
      id="friendly-neighbourhood-matches"
      aria-labelledby="nb-matches-title"
      className="rounded-xl border border-emerald-500/25 bg-linear-to-br from-emerald-950/35 to-black/60 p-4 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-400">
            <Users className="size-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 id="nb-matches-title" className="text-sm font-semibold text-white">
              Friendly neighbourhood
            </h3>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/60">
              Simulated corridor overlap: if someone else is travelling a similar leg right now, you can
              request a pooled ride instead of booking a solo cab. Endpoints above define your trip —
              matches refresh on a timer for the demo.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 border-emerald-500/35 text-emerald-200/95 hover:bg-emerald-500/10"
          onClick={() => setTick((x) => x + 1)}
        >
          <RefreshCw className="mr-1.5 size-3.5" />
          Refresh matches
        </Button>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[11px] text-white/45">
        Trip: <span className="font-mono text-white/70">{formatCoordsShort(from)}</span>
        {' → '}
        <span className="font-mono text-white/70">{formatCoordsShort(to)}</span>
      </div>

      {banner ? (
        <p
          className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-950/50 px-3 py-2 text-xs text-emerald-100/95"
          role="status"
        >
          {banner}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {matches.map((m) => (
          <li
            key={m.id}
            className="flex flex-col gap-3 rounded-lg border border-white/10 bg-black/35 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{m.displayName}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/50">
                <span className="inline-flex items-center gap-1">
                  <Car className="size-3.5 text-emerald-400/90" />
                  ~{m.overlapPct}% same corridor
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="size-3.5 text-white/40" />
                  rolls in ~{m.departsInMin} min
                </span>
                <span>
                  {m.seatsAvailable} seat{m.seatsAvailable > 1 ? 's' : ''} free (sim)
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-600/90"
              disabled={requestingId !== null}
              onClick={() => onRequest(m.id, m.displayName)}
            >
              {requestingId === m.id ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="mr-1.5 size-3.5" />
                  Request ride
                </>
              )}
            </Button>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-[10px] leading-relaxed text-white/38">
        Simulation only — no real users or dispatch. Pairs with congestion + routes using the same From /
        To pins.
      </p>
    </section>
  )
}
