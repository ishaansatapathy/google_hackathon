import { Activity, ArrowLeft, Radio, Shield, Wifi } from 'lucide-react'
import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { AuthHeaderChrome } from '@/components/auth/AuthHeaderChrome'
import { EmergencyCommandMap } from '@/components/emergency/EmergencyCommandMap'
import { TargoLogo } from '@/components/TargoLogo'
import { SiteFooter } from '@/components/sections/SiteFooter'
import { Button } from '@/components/ui/button'
import {
  BANGALORE_STATION_COUNT,
  stationsGroupedForSelect,
} from '@/lib/emergency/bangalorePoliceStations'
import { congestionLabelEn, predictCityCongestionIndex } from '@/lib/emergency/congestionPredictor'
import { fetchSosSessions } from '@/lib/sos/api'
import { setHash } from '@/lib/hashRoute'
import type { SosSession, SosSsePayload, SosTracePayload } from '@/lib/sos/types'
import { cn } from '@/lib/utils'

function stageBadge(stage: SosSession['stage']) {
  switch (stage) {
    case 'nearest_peers':
      return 'bg-sky-500/20 text-sky-200 ring-sky-500/30'
    case 'mesh_hop':
      return 'bg-amber-500/20 text-amber-100 ring-amber-500/35'
    case 'emergency_escalated':
      return 'bg-red-600/25 text-red-100 ring-red-500/40'
    default:
      return 'bg-white/10 text-white/80'
  }
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return '—'
  }
}

function ingestPayload(
  raw: unknown,
  setById: Dispatch<SetStateAction<Record<string, SosSession>>>,
  setTrace: Dispatch<SetStateAction<SosTracePayload | null>>,
  bumpTrace: () => void,
) {
  if (!raw || typeof raw !== 'object') return
  const p = raw as SosSsePayload & { type?: string }
  if (p.type === 'sos_alert' || p.type === 'sos_update') {
    setById((prev) => ({ ...prev, [p.session.id]: p.session }))
  }
  if (p.type === 'sos_trace') {
    setTrace(p)
    bumpTrace()
  }
}

export function EmergencyServicesPage() {
  const [byId, setById] = useState<Record<string, SosSession>>({})
  const [sseOk, setSseOk] = useState(false)
  const [wsOk, setWsOk] = useState(false)
  const [scanning, setScanning] = useState(true)
  const [riskZones, setRiskZones] = useState(false)
  const [riskScore, setRiskScore] = useState(() => predictCityCongestionIndex())
  const [traceEvent, setTraceEvent] = useState<SosTracePayload | null>(null)
  const [traceSeq, setTraceSeq] = useState(0)
  const [selectedStationId, setSelectedStationId] = useState('vidhana-soudha')

  const bumpTrace = useCallback(() => {
    setTraceSeq((n) => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    void fetchSosSessions().then((rows) => {
      if (cancelled) return
      const next: Record<string, SosSession> = {}
      for (const s of rows) next[s.id] = s
      setById(next)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const es = new EventSource('/api/sos/stream')
    es.onopen = () => setSseOk(true)
    es.onerror = () => setSseOk(false)
    es.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data) as unknown
        ingestPayload(p, setById, setTraceEvent, bumpTrace)
      } catch {
        /* ignore */
      }
    }
    return () => es.close()
  }, [bumpTrace])

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/api/sos`)
    ws.onopen = () => setWsOk(true)
    ws.onclose = () => setWsOk(false)
    ws.onerror = () => setWsOk(false)
    ws.onmessage = (ev) => {
      try {
        const p = JSON.parse(String(ev.data)) as { type?: string }
        if (p.type === 'emergency_ws') return
        ingestPayload(p, setById, setTraceEvent, bumpTrace)
      } catch {
        /* ignore */
      }
    }
    return () => ws.close()
  }, [bumpTrace])

  useEffect(() => {
    const tick = () => setRiskScore(predictCityCongestionIndex())
    tick()
    const id = window.setInterval(tick, 8000)
    return () => window.clearInterval(id)
  }, [])

  const rows = useMemo(() => Object.values(byId).sort((a, b) => b.createdAt - a.createdAt), [byId])
  const activeMesh = rows.filter((s) => s.stage === 'mesh_hop' || s.stage === 'nearest_peers').length
  const escalated = rows.filter((s) => s.stage === 'emergency_escalated').length

  return (
    <div className="min-h-svh bg-[#05080c] font-sans antialiased text-white">
      <header className="sticky top-0 z-50 border-b border-emerald-500/15 bg-black/85 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-emerald-200/80 hover:bg-emerald-500/10 hover:text-emerald-100"
              onClick={() => setHash({ page: 'home', tab: 'features' })}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Home
            </Button>
            <span className="hidden h-4 w-px bg-emerald-500/25 sm:block" aria-hidden />
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-emerald-400" aria-hidden />
              <TargoLogo />
            </div>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400/90 sm:inline">
              Targo · Emergency services
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] text-emerald-100/55">
            <AuthHeaderChrome compact />
            <span className="inline-flex items-center gap-1.5">
              <Wifi className={wsOk ? 'size-3.5 text-emerald-400' : 'size-3.5 text-white/25'} aria-hidden />
              WS {wsOk ? 'live' : '…'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Activity className={sseOk ? 'size-3.5 text-emerald-400' : 'size-3.5 text-white/25'} aria-hidden />
              SSE {sseOk ? 'live' : '…'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Radio className="size-3.5 text-emerald-500/60" aria-hidden />
              Mesh relay (demo)
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] flex-col gap-0 lg:min-h-[calc(100svh-56px)] lg:flex-row">
        <aside className="flex w-full shrink-0 flex-col gap-4 border-b border-emerald-500/10 p-4 font-mono lg:w-[320px] lg:border-b-0 lg:border-r lg:p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-500/80">Command station</p>
            <select
              className="mt-2 w-full rounded-md border border-emerald-500/20 bg-black/60 px-3 py-2 text-[12px] leading-snug text-emerald-100/90 outline-none focus:border-emerald-400/50"
              value={selectedStationId}
              onChange={(e) => setSelectedStationId(e.target.value)}
            >
              {stationsGroupedForSelect().map(({ region, label, stations }) => (
                <optgroup key={region} label={label}>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-emerald-500/15 bg-emerald-950/20 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/70">Operational status</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex justify-between gap-2 text-emerald-100/85">
                <span className="text-emerald-100/50">Stations</span>
                <span className="text-emerald-300">{BANGALORE_STATION_COUNT}</span>
              </li>
              <li className="flex justify-between gap-2 text-emerald-100/85">
                <span className="text-emerald-100/50">Mesh links</span>
                <span className="font-mono text-emerald-300">{activeMesh || '0'}</span>
              </li>
              <li className="flex justify-between gap-2 text-emerald-100/85">
                <span className="text-emerald-100/50">Scan</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-emerald-400">
                  <span
                    className={cn(
                      'inline-block size-2 rounded-full',
                      scanning ? 'animate-pulse bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-white/25',
                    )}
                  />
                  {scanning ? 'SCANNING' : 'HOLD'}
                </span>
              </li>
              <li className="flex justify-between gap-2 text-emerald-100/85">
                <span className="text-emerald-100/50">Escalations</span>
                <span className={cn('font-mono', escalated > 0 ? 'text-red-400' : 'text-emerald-300/80')}>
                  {escalated > 0 ? `${escalated} ACTIVE` : 'NONE'}
                </span>
              </li>
              <li className="flex justify-between gap-2 text-emerald-100/85">
                <span className="text-emerald-100/50">SOS sessions</span>
                <span className="font-mono text-emerald-300">{rows.length}</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full border border-emerald-500/40 bg-emerald-600/25 text-emerald-50 hover:bg-emerald-500/35"
              onClick={() => setScanning((s) => !s)}
            >
              {scanning ? 'Disable scan' : 'Enable scan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full border-red-500/45 text-red-200/90 hover:bg-red-950/40',
                riskZones && 'bg-red-950/30',
              )}
              onClick={() => setRiskZones((z) => !z)}
            >
              {riskZones ? 'Hide risk zones' : 'Show risk zones'}
            </Button>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">Risk assessment</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold tabular-nums text-amber-200">{riskScore}</p>
                <p className="text-[10px] uppercase tracking-wider text-amber-500/80">/ 100 · demo predictor</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0 text-amber-200/80 hover:bg-amber-500/15"
                onClick={() => setRiskScore(predictCityCongestionIndex())}
              >
                Sync live
              </Button>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-[width]"
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[9px] uppercase tracking-wider text-emerald-500/55">
              <span className={riskScore >= 67 ? 'text-red-400/90' : 'text-emerald-100/35'}>Danger</span>
              <span className={riskScore >= 34 && riskScore < 67 ? 'text-amber-300/90' : 'text-emerald-100/35'}>Caution</span>
              <span className={riskScore < 34 ? 'text-emerald-400/90' : 'text-emerald-100/35'}>Safe</span>
            </div>
            <p className="mt-2 text-[10px] leading-snug text-amber-200/60">{congestionLabelEn(riskScore)}</p>
          </div>

          <div className="rounded-lg border border-emerald-500/15 bg-black/40 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-400/70">Active units</p>
            <p className="mt-2 text-[12px] text-emerald-400/90">
              {rows.length === 0 ? 'No units detected' : `${rows.length} SOS session(s) on mesh`}
            </p>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-500/70">Recent alerts</p>
            <div className="mt-2 max-h-[200px] space-y-2 overflow-y-auto pr-1 text-[11px]">
              {rows.length === 0 ? (
                <p className="text-emerald-100/45">No SOS yet — use the header SOS button (demo relay).</p>
              ) : (
                rows.slice(0, 6).map((s) => (
                  <div
                    key={s.id}
                    className="rounded border border-white/8 bg-black/30 px-2 py-1.5 font-mono text-emerald-100/80"
                  >
                    <div className="flex justify-between gap-2">
                      <span>{formatTime(s.createdAt)}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0 text-[10px] ring-1 ring-inset',
                          stageBadge(s.stage),
                        )}
                      >
                        {s.stage.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {s.lat != null && s.lng != null && (
                      <div className="mt-0.5 text-[10px] text-emerald-100/50">
                        {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="relative h-[min(70vh,640px)] w-full flex-1 lg:h-[calc(100svh-56px)] lg:min-h-0">
          <EmergencyCommandMap
            sessions={rows}
            traceEvent={traceEvent}
            traceSeq={traceSeq}
            selectedStationId={selectedStationId}
            congestionIndex={riskScore}
            riskZonesVisible={riskZones}
          />

          <div className="pointer-events-none absolute right-4 top-4 z-[500] max-w-[220px] rounded border border-emerald-500/25 bg-black/75 px-3 py-2 font-mono text-[10px] leading-relaxed text-emerald-400/95 shadow-lg backdrop-blur-sm">
            <div>GRID {scanning ? 'ACTIVE' : 'STANDBY'}</div>
            <div>RANGE {riskZones ? '5 KM' : '2 KM'}</div>
            <div>MODE TACTICAL</div>
            <div>ZONES {riskZones ? 'VISIBLE' : 'HIDDEN'}</div>
          </div>

          <div className="pointer-events-none absolute bottom-4 right-4 z-[500] rounded border border-white/10 bg-black/70 px-3 py-2 text-[10px] text-emerald-100/75 backdrop-blur-sm">
            <div className="mb-1 font-semibold uppercase tracking-wider text-emerald-500/80">Legend</div>
            <ul className="space-y-1">
              <li>
                <span className="mr-1.5 inline-block size-2 rounded-full bg-emerald-500" /> Station
              </li>
              <li>
                <span className="mr-1.5 inline-block size-2 rounded-full bg-indigo-500" /> Security checkpoint
              </li>
              <li>
                <span className="mr-1.5 inline-block h-3 w-3 rounded-full border-2 border-red-600 bg-red-500/40 align-middle" />{' '}
                Risk zone (toggle)
              </li>
              <li>
                <span className="mr-1.5 inline-block size-2 rounded-full bg-red-500" /> SOS origin
              </li>
              <li>
                <span className="mr-1.5 inline-block h-0.5 w-4 bg-emerald-500 align-middle" /> Nearest mesh
              </li>
              <li>
                <span className="mr-1.5 inline-block h-0.5 w-4 bg-amber-500 align-middle" /> Wide ring
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-4 md:px-8">
        <div className="overflow-hidden rounded-xl border border-emerald-500/15 bg-emerald-950/10">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-500/15 text-[10px] uppercase tracking-wide text-emerald-100/45">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Session</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-emerald-100/45">
                    No alerts yet — press <strong className="text-emerald-200/90">SOS</strong> in the header (with the dev
                    relay running).
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id} className="border-b border-emerald-500/10 text-emerald-100/85 last:border-0">
                    <td className="px-4 py-3 align-top font-mono text-xs text-emerald-200/70">{formatTime(s.createdAt)}</td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          stageBadge(s.stage),
                        )}
                      >
                        {s.stage.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-emerald-100/60">
                      {s.lat != null && s.lng != null ? (
                        <>
                          {s.lat.toFixed(4)}, {s.lng.toFixed(4)}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 align-top font-mono text-[11px] text-emerald-100/45">{s.id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
