import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Clock, Loader2, Radio, Sparkles } from 'lucide-react'

import { useCommuteLocations } from '@/context/CommuteLocationsContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { distanceKm, formatCoordsShort, inferMetroForTrip } from '@/lib/geoMetro'
import {
  aggregateAnomalyLevel,
  augmentPredictionsWithAnomaly,
  buildPredictions,
  CORRIDORS,
  recommendAction,
  type CorridorPredictionWithAnomaly,
  type CorridorSensors,
  type MetroCity,
  type Recommendation,
} from '@/lib/congestionEngine'
import { buildCongestionNarrativePrompt } from '@/lib/congestionNarrative'
import { callClaudeText } from '@/lib/jamClaude'
import type { WsStatus } from '@/hooks/useCommuteWebSocket'

function severityColor(score: number): string {
  if (score < 45) return 'bg-emerald-500'
  if (score < 72) return 'bg-amber-400'
  return 'bg-red-500'
}

function CardRec({ rec }: { rec: Recommendation }) {
  const title =
    rec.headline === 'leave_now'
      ? 'Leave now'
      : rec.headline === 'wait'
        ? `Wait ${rec.waitMinutes ?? 20} mins`
        : 'Take alternate route'

  return (
    <div className="rounded-xl border-2 border-[#EE3F2C]/50 bg-linear-to-br from-[#EE3F2C]/20 to-black/60 p-5 md:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#EE3F2C]">
        Recommendation
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</p>
      <p className="mt-3 text-sm leading-relaxed text-white/75">{rec.detail}</p>
      {rec.headline === 'alternate' && rec.alternateVia ? (
        <p className="mt-4 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm font-medium text-amber-100/95">
          Suggested bypass: <span className="text-white">{rec.alternateVia}</span>
        </p>
      ) : null}
    </div>
  )
}

type Props = {
  corridors: CorridorSensors[]
  lastSnapshotTs: number | null
  wsStatus: WsStatus
}

export function CongestionPredictorTab({ corridors, lastSnapshotTs, wsStatus }: Props) {
  const { from, to } = useCommuteLocations()
  const [city, setCity] = useState<MetroCity>('Mumbai')
  const [departure, setDeparture] = useState(() => {
    const d = new Date()
    d.setMinutes(d.getMinutes() - (d.getTimezoneOffset() ?? 0))
    return d.toISOString().slice(0, 16)
  })

  useEffect(() => {
    setCity(inferMetroForTrip(from, to))
  }, [from, to])

  const tripKm = useMemo(() => distanceKm(from, to), [from, to])

  const filteredSensors = useMemo(() => {
    const ids = new Set(CORRIDORS.filter((c) => c.city === city).map((c) => c.id))
    const live = corridors.filter((c) => ids.has(c.id))
    if (live.length > 0) return live
    return CORRIDORS.filter((c) => c.city === city).map((c) => ({
      id: c.id,
      vehicleCount: 650,
      speedKmh: 32,
      density: 0.55,
    }))
  }, [corridors, city])

  const departureDate = useMemo(() => new Date(departure), [departure])

  const predictions = useMemo((): CorridorPredictionWithAnomaly[] => {
    const base = buildPredictions(filteredSensors, departureDate)
    return augmentPredictionsWithAnomaly(base, departureDate)
  }, [filteredSensors, departureDate])

  const rec = useMemo(
    () =>
      recommendAction(
        predictions,
        `From ${formatCoordsShort(from)}`,
        `To ${formatCoordsShort(to)}`,
        { tripKm },
      ),
    [predictions, from, to, tripKm],
  )

  const aggregateAnomaly = useMemo(() => aggregateAnomalyLevel(predictions), [predictions])

  const [narrative, setNarrative] = useState<string | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeErr, setNarrativeErr] = useState<string | null>(null)
  const narrativeSeq = useRef(0)

  useEffect(() => {
    const hasKey = Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY)
    if (!hasKey) {
      setNarrative(null)
      setNarrativeErr(null)
      setNarrativeLoading(false)
      return
    }
    const seq = ++narrativeSeq.current
    const t = window.setTimeout(() => {
      const prompt = buildCongestionNarrativePrompt({
        city,
        departureIso: departureDate.toISOString(),
        fromLabel: `From ${formatCoordsShort(from)}`,
        toLabel: `To ${formatCoordsShort(to)}`,
        rec,
        predictions,
      })
      setNarrativeLoading(true)
      setNarrativeErr(null)
      void callClaudeText(prompt)
        .then((text) => {
          if (narrativeSeq.current !== seq) return
          setNarrative(text.trim())
        })
        .catch((e: unknown) => {
          if (narrativeSeq.current !== seq) return
          setNarrativeErr(e instanceof Error ? e.message : 'Narration failed')
          setNarrative(null)
        })
        .finally(() => {
          if (narrativeSeq.current !== seq) return
          setNarrativeLoading(false)
        })
    }, 450)
    return () => window.clearTimeout(t)
  }, [city, departureDate, from, to, rec, predictions])

  return (
    <div className="flex flex-col gap-10 md:gap-12">
      <CardRec rec={rec} />

      {aggregateAnomaly !== 'none' ? (
        <p
          className={`rounded-lg border px-3 py-2 text-sm ${
            aggregateAnomaly === 'severe'
              ? 'border-red-500/40 bg-red-950/35 text-red-100/95'
              : 'border-amber-500/35 bg-amber-950/30 text-amber-100/95'
          }`}
        >
          Worse than usual for this hour (simulated baseline). Demo only — not live traffic authority
          data.
        </p>
      ) : null}

      <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 p-4 md:p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300/90">
          <Sparkles className="size-3.5" />
          Plain English (GenAI)
        </div>
        {!import.meta.env.VITE_ANTHROPIC_API_KEY ? (
          <p className="mt-2 text-sm text-white/60">
            Add{' '}
            <code className="rounded bg-white/10 px-1 text-xs text-white/85">VITE_ANTHROPIC_API_KEY</code> for AI
            narration (demo).
          </p>
        ) : narrativeLoading ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-white/70">
            <Loader2 className="size-4 shrink-0 animate-spin text-violet-400" />
            Generating summary…
          </p>
        ) : narrativeErr ? (
          <p className="mt-2 text-sm text-red-300/90" role="alert">
            {narrativeErr}
          </p>
        ) : narrative ? (
          <p className="mt-3 text-sm leading-relaxed text-white/85">{narrative}</p>
        ) : (
          <p className="mt-2 text-sm text-white/45">Summary will appear here.</p>
        )}
      </div>

      <div className="grid gap-6 rounded-xl border border-white/10 bg-[#0a0a0a] p-4 md:grid-cols-2 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="city">Metro</Label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value as MetroCity)}
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-sm text-white"
          >
            <option value="Mumbai">Mumbai</option>
            <option value="Delhi">Delhi NCR</option>
            <option value="Bangalore">Bengaluru</option>
          </select>
        </div>
        <div className="flex flex-col justify-end gap-2 text-xs text-white/45">
          <span className="flex items-center gap-2">
            <Radio className="size-3.5 text-emerald-400" />
            Live sensors: {wsStatus === 'open' ? 'connected' : wsStatus}
            {lastSnapshotTs ? (
              <span className="text-white/35">
                · last {new Date(lastSnapshotTs).toLocaleTimeString()}
              </span>
            ) : null}
          </span>
          <span>Updates every ~30s (simulated feed)</span>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Trip (from map above)</Label>
          <div className="grid gap-2 rounded-lg border border-white/10 bg-black/50 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#EE3F2C]">From A</p>
              <p className="mt-0.5 font-mono text-xs text-white/85">{formatCoordsShort(from)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-blue-400">To B</p>
              <p className="mt-0.5 font-mono text-xs text-white/85">{formatCoordsShort(to)}</p>
            </div>
            <p className="sm:col-span-2 text-xs text-white/50">
              Straight-line distance ~<strong className="text-white/80">{tripKm.toFixed(1)} km</strong> — used to tune the recommendation.
            </p>
          </div>
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dep">Departure time</Label>
          <div className="relative max-w-md">
            <Clock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <Input
              id="dep"
              type="datetime-local"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="border-white/15 bg-black pl-10 text-white"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 md:p-6">
        <h3 className="text-sm font-semibold text-white">Corridor load (0–100)</h3>
        <p className="mt-1 text-xs text-white/55">
          Bars: <span className="text-emerald-400">now</span> ·{' '}
          <span className="text-amber-300">+15 min</span> ·{' '}
          <span className="text-red-300">+30 min</span> forecast
        </p>
        <div className="mt-6 space-y-5">
          {predictions.map((p) => (
            <CorridorBars key={p.id} p={p} showAnomaly />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 md:p-6">
        <h3 className="text-sm font-semibold text-white">Prediction timeline</h3>
        <p className="mt-1 text-xs text-white/55">Per corridor — worst-case score across the window</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="pb-2 pr-4">Corridor</th>
                <th className="pb-2 pr-4">Now</th>
                <th className="pb-2 pr-4">+15 min</th>
                <th className="pb-2">+30 min</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p) => (
                <tr key={p.id} className="border-b border-white/6 text-white/85">
                  <td className="py-2 pr-4">{p.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.now.toFixed(0)}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{p.t15.toFixed(0)}</td>
                  <td className="py-2 font-mono text-xs">{p.t30.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-white/8 bg-black/40 px-3 py-2 text-[11px] text-white/45">
        <Activity className="size-3.5 text-[#EE3F2C]" />
        Model: weighted load (vehicles / speed / density) × time-of-day × historical peak — demo only.
        “Vs baseline” uses a mock hourly baseline (not real ML). GenAI summary optional via Anthropic key.
      </div>
    </div>
  )
}

function CorridorBars({ p, showAnomaly }: { p: CorridorPredictionWithAnomaly; showAnomaly?: boolean }) {
  const rows: { label: string; score: number }[] = [
    { label: 'Now', score: p.now },
    { label: '+15', score: p.t15 },
    { label: '+30', score: p.t30 },
  ]
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-white">{p.name}</span>
        <div className="flex flex-wrap items-center gap-2">
          {showAnomaly && p.anomaly !== 'none' ? (
            <span
              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                p.anomaly === 'severe'
                  ? 'bg-red-500/25 text-red-300'
                  : 'bg-amber-500/20 text-amber-200/95'
              }`}
            >
              vs baseline: {p.anomaly}
            </span>
          ) : null}
          <span
            className={`text-[10px] font-semibold uppercase ${
              p.severity === 'low'
                ? 'text-emerald-400'
                : p.severity === 'moderate'
                  ? 'text-amber-300'
                  : 'text-red-400'
            }`}
          >
            {p.severity}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-10 shrink-0 text-[10px] text-white/45">{r.label}</span>
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full transition-all ${severityColor(r.score)}`}
                style={{ width: `${Math.min(100, r.score)}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-[11px] text-white/70">
              {r.score.toFixed(0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
