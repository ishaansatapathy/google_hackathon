import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Check,
  ChevronRight,
  Phone,
  Radio,
  Shield,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { SosLiveMap } from '@/components/sos/SosLiveMap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useResponderSimulation, type ResponderPhase } from '@/hooks/useResponderSimulation'
import { postSosAlert } from '@/lib/sos/api'
import { fetchOsrmDrivingRoute, type LatLngTuple } from '@/lib/sos/fetchOsrmRoute'
import { responderStartPoint } from '@/lib/sos/responderSim'
import type { SosSession, SosSsePayload, SosStage } from '@/lib/sos/types'
import { cn } from '@/lib/utils'

const DEMO_FALLBACK = { lat: 19.076, lng: 72.8777 }

const HANDSHAKE_STEPS = [
  { title: 'GPS location acquired', sub: '' as string | null },
  { title: 'Emergency packet generated', sub: null as string | null },
  { title: 'Sent to mesh coordinator', sub: null },
  { title: 'Community responders notified', sub: '3 nearby' },
  { title: 'Waiting for responder acceptance…', sub: null },
  { title: 'Responder assigned', sub: 'Arjun Kumar · ~1.2 km' },
] as const

function ribbonBadgeSim(phase: ResponderPhase, sessionStage: SosStage | undefined) {
  if (sessionStage === 'emergency_escalated') return 'DISPATCH'
  if (sessionStage === 'mesh_hop') return 'RELAY'
  switch (phase) {
    case 'searching':
      return 'CONNECTING'
    case 'accepted':
      return 'ACCEPTED'
    case 'moving':
      return 'ENROUTE'
    case 'arrived':
      return 'ARRIVED'
    default:
      return 'LIVE'
  }
}

function ribbonSubtitleSim(phase: ResponderPhase, sessionStage: SosStage | undefined) {
  if (sessionStage === 'emergency_escalated') return 'Emergency coordination channel (sim)'
  if (sessionStage === 'mesh_hop') return 'Multi-hop path · widening ring'
  switch (phase) {
    case 'searching':
      return 'Finding nearest mesh nodes…'
    case 'accepted':
      return 'Responder confirmed · starting approach'
    case 'moving':
      return 'Live approach · road route (OSRM demo)'
    case 'arrived':
      return 'Responder reached your location (sim)'
    default:
      return 'Nearest mesh nodes first'
  }
}

function formatDist(m: number) {
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(2)} km`
}

function formatEta(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

type Step = { done: boolean; title: string; detail: string; icon: typeof Users }

type Flow = 'handshake' | 'live'

export function SosMeshModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [flow, setFlow] = useState<Flow>('handshake')
  const [handshakeStep, setHandshakeStep] = useState(0)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [routeTuples, setRouteTuples] = useState<LatLngTuple[] | null>(null)
  const [session, setSession] = useState<SosSession | null>(null)
  const [relayErr, setRelayErr] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [contactPhone, setContactPhone] = useState('')
  const [contactCount, setContactCount] = useState(0)

  const simEnabled =
    flow === 'live' && coords !== null && routeTuples !== null && !locating

  const { phase: simPhase, tick } = useResponderSimulation(
    simEnabled,
    coords?.lat ?? null,
    coords?.lng ?? null,
    routeTuples,
  )

  useEffect(() => {
    if (!open || !session?.id) return
    const sid = session.id
    const es = new EventSource('/api/sos/stream')
    es.onmessage = (ev) => {
      try {
        const p = JSON.parse(ev.data) as SosSsePayload
        if ((p.type === 'sos_alert' || p.type === 'sos_update') && p.session.id === sid) {
          setSession(p.session)
        }
      } catch {
        /* ignore */
      }
    }
    return () => es.close()
  }, [open, session?.id])

  useEffect(() => {
    setFlow('handshake')
    setHandshakeStep(0)
    setCoords(null)
    setRouteTuples(null)
    setSession(null)
    setRelayErr(null)
    setLocating(false)
    setContactPhone('')
  }, [open])

  useEffect(() => {
    if (!open || flow !== 'handshake') return
    setHandshakeStep(0)
    const delays = [550, 520, 540, 680, 820, 640]
    let acc = 0
    const timers: number[] = []
    for (let i = 0; i < 6; i++) {
      acc += delays[i]
      timers.push(window.setTimeout(() => setHandshakeStep(i + 1), acc))
    }
    return () => timers.forEach(clearTimeout)
  }, [open, flow])

  useEffect(() => {
    if (!open || flow !== 'live') return
    let cancelled = false
    setLocating(true)
    setRelayErr(null)
    setRouteTuples(null)

    const run = async () => {
      let lat = DEMO_FALLBACK.lat
      let lng = DEMO_FALLBACK.lng
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 120_000,
            })
          })
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch {
          /* demo fallback */
        }
      }
      if (cancelled) return
      setCoords({ lat, lng })

      const start = responderStartPoint(lat, lng)
      let route: LatLngTuple[]
      try {
        route = await fetchOsrmDrivingRoute(start, { lat, lng })
      } catch {
        route = [
          [start.lat, start.lng],
          [lat, lng],
        ]
      }
      if (cancelled) return
      setRouteTuples(route)
      setLocating(false)

      try {
        const { session: s } = await postSosAlert({ lat, lng, message: 'header_sos' })
        if (!cancelled) {
          setSession(s)
          setRelayErr(null)
        }
      } catch {
        if (!cancelled) setRelayErr('Ops relay offline (optional — simulation still runs)')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [open, flow])

  const stage = session?.stage ?? 'nearest_peers'

  const steps: Step[] = [
    {
      done: simPhase !== 'searching' && simPhase !== 'idle',
      title: 'Nearest mesh nodes',
      detail: 'Ping the closest active clients in range (sim · 3 nodes).',
      icon: Users,
    },
    {
      done: simPhase === 'moving' || simPhase === 'arrived' || stage === 'emergency_escalated',
      title: 'Multi-hop relay',
      detail: 'Packets hop when the direct path is congested (timed simulation).',
      icon: Radio,
    },
    {
      done: stage === 'emergency_escalated' || simPhase === 'arrived',
      title: 'Emergency handoff',
      detail: 'Unresolved alerts route to the public emergency channel (simulation only).',
      icon: ShieldAlert,
    },
  ]

  const showMap = flow === 'live' && coords !== null
  const dist = tick?.distanceM
  const eta = tick?.etaSec

  const responderLat =
    coords &&
    routeTuples &&
    routeTuples.length >= 1 &&
    (simPhase === 'accepted' || simPhase === 'moving' || simPhase === 'arrived')
      ? simPhase === 'accepted'
        ? routeTuples[0][0]
        : (tick?.responderLat ?? null)
      : null
  const responderLng =
    coords &&
    routeTuples &&
    routeTuples.length >= 1 &&
    (simPhase === 'accepted' || simPhase === 'moving' || simPhase === 'arrived')
      ? simPhase === 'accepted'
        ? routeTuples[0][1]
        : (tick?.responderLng ?? null)
      : null

  const onConfirmSend = () => {
    setFlow('live')
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal
          aria-labelledby="sos-dialog-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            aria-label="Close"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 flex max-h-[min(92dvh,780px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-red-500/25 bg-[#070708] shadow-[0_0_0_1px_rgba(239,68,68,0.12),0_24px_80px_rgba(0,0,0,0.65)]"
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            <div className="border-b border-red-950/80 bg-gradient-to-r from-red-950/90 via-[#1a0a0c] to-red-950/70 px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {flow === 'handshake' ? (
                    <>
                      <Activity className="size-4 text-emerald-400/90" aria-hidden />
                      <span id="sos-dialog-title" className="text-[13px] font-semibold tracking-wide text-white">
                        Prepare emergency
                      </span>
                      <span className="rounded border border-white/20 bg-white/8 px-2 py-0.5 text-[10px] font-bold tracking-widest text-white/85">
                        SETUP
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[13px] font-semibold tracking-wide text-white">Emergency mode active</span>
                      <span className="rounded border border-amber-400/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-100">
                        {ribbonBadgeSim(simPhase, session?.stage)}
                      </span>
                    </>
                  )}
                </div>
                {flow === 'live' ? (
                  <p className="max-w-[14rem] text-right text-[11px] leading-snug text-red-100/75 sm:max-w-none">
                    {ribbonSubtitleSim(simPhase, session?.stage)}
                  </p>
                ) : (
                  <p className="max-w-[14rem] text-right text-[11px] leading-snug text-red-100/70 sm:max-w-none">
                    Review steps, then send alert
                  </p>
                )}
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
              {flow === 'handshake' ? (
                <>
                  <div className="rounded-xl border border-white/10 bg-[#0c1018] p-4">
                    <div className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-white">
                      <Activity className="size-4 text-emerald-400" aria-hidden />
                      Live emergency activity
                    </div>
                    <div className="relative space-y-0 border-l-2 border-white/15 pl-4">
                      {HANDSHAKE_STEPS.map((step, i) => {
                        const done = handshakeStep > i
                        return (
                          <motion.div
                            key={step.title}
                            className="relative pb-5 last:pb-0"
                            initial={false}
                            animate={{
                              opacity: done ? 1 : 0.4,
                            }}
                            transition={{ duration: 0.35 }}
                          >
                            <span
                              className={cn(
                                'absolute -left-[21px] top-0.5 flex size-[18px] items-center justify-center rounded-full border-2',
                                done
                                  ? 'border-emerald-500 bg-emerald-500/25'
                                  : 'border-white/25 bg-[#0c1018]',
                              )}
                            >
                              {done ? <Check className="size-2.5 text-emerald-300" strokeWidth={3} /> : null}
                            </span>
                            <p className={cn('text-[13px] font-medium', done ? 'text-white' : 'text-white/45')}>
                              {step.title}
                            </p>
                            {step.sub ? (
                              <p className="mt-0.5 text-[11px] text-white/45">{step.sub}</p>
                            ) : null}
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-950/30 p-5">
                    <p className="text-center text-[12px] leading-relaxed text-white/55">
                      This does not dispatch real emergency services. Confirm only if you need the demo relay.
                    </p>
                    <Button
                      type="button"
                      disabled={handshakeStep < 6}
                      className={cn(
                        'h-12 w-full max-w-sm gap-2 rounded-full text-[13px] font-bold uppercase tracking-wide text-white shadow-lg disabled:opacity-40',
                        'bg-red-600 hover:bg-red-500',
                      )}
                      onClick={onConfirmSend}
                    >
                      <Phone className="size-5" aria-hidden />
                      Send emergency alert
                    </Button>
                    {handshakeStep < 6 ? (
                      <p className="text-[11px] text-white/40">Complete checklist above…</p>
                    ) : null}
                  </div>
                </>
              ) : null}

              {flow === 'live' ? (
                <>
                  {relayErr ? (
                    <p className="text-center text-[11px] leading-relaxed text-amber-200/70">{relayErr}</p>
                  ) : null}

                  {locating || !showMap ? (
                    <div className="flex h-[220px] items-center justify-center rounded-xl border border-white/10 bg-[#0a1628]/80">
                      <div className="flex flex-col items-center gap-3">
                        <motion.div
                          className="size-12 rounded-full border-2 border-red-500/50"
                          animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <p className="text-sm text-white/55">Building road route…</p>
                      </div>
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-white">
                          <ChevronRight className="size-4 text-sky-400/90" aria-hidden />
                          <h2 className="text-[15px] font-semibold tracking-tight">Live response tracking</h2>
                        </div>
                        <div className="flex shrink-0 items-baseline gap-3 font-mono text-[13px]">
                          <span className="text-amber-300/95">{dist != null ? formatDist(dist) : '—'}</span>
                          <span className="text-white/35">·</span>
                          <span className="text-amber-300/95">ETA {eta != null ? formatEta(eta) : '—'}</span>
                        </div>
                      </div>
                      <div className="relative overflow-hidden rounded-xl ring-1 ring-sky-500/15">
                        <SosLiveMap
                          active={showMap}
                          userLat={coords!.lat}
                          userLng={coords!.lng}
                          responderLat={responderLat}
                          responderLng={responderLng}
                          responderName="Arjun Kumar"
                          routeLatLngs={routeTuples}
                        />
                        {simPhase === 'accepted' ? (
                          <motion.div
                            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 backdrop-blur-[2px]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.25 }}
                          >
                            <div className="mx-4 rounded-xl border border-emerald-500/45 bg-emerald-950/92 px-4 py-3 text-center shadow-lg">
                              <p className="text-[13px] font-semibold text-white">Arjun Kumar accepted</p>
                              <p className="mt-1 text-[12px] text-emerald-100/85">Following road route to you</p>
                            </div>
                          </motion.div>
                        ) : null}
                        <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[10px] text-white/65 backdrop-blur-sm">
                          OSRM routing · demo
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              ) : null}

              {flow === 'live' && !locating && showMap ? (
                <>
                  <div className="rounded-xl border border-white/10 bg-white/3 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                        <Shield className="size-4 text-sky-400/90" aria-hidden />
                        Trusted contacts
                      </div>
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[11px] tabular-nums text-white/60">
                        {contactCount}
                      </span>
                    </div>
                    {contactCount === 0 ? (
                      <p className="mb-3 text-[12px] text-white/40">No contacts added yet.</p>
                    ) : (
                      <p className="mb-3 text-[12px] text-white/55">{contactCount} contact(s) will receive SMS (demo).</p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        inputMode="numeric"
                        placeholder="Phone (e.g. 9876543210)"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="h-9 border-white/15 bg-black/40 text-white placeholder:text-white/35"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 shrink-0 border-white/15 bg-white/10 text-white hover:bg-white/15"
                        onClick={() => {
                          if (contactPhone.replace(/\D/g, '').length >= 8) setContactCount((c) => c + 1)
                        }}
                      >
                        + Add
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/40">Relay chain</p>
                    <ul className="grid gap-2">
                      {steps.map((s, idx) => (
                        <motion.li
                          key={s.title}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * idx, duration: 0.25 }}
                          className={cn(
                            'flex gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors',
                            s.done
                              ? 'border-emerald-500/35 bg-emerald-500/8'
                              : simPhase === 'moving' && idx === 1
                                ? 'border-amber-500/45 bg-amber-500/12'
                                : 'border-white/10 bg-white/3',
                          )}
                        >
                          <s.icon
                            className={cn('mt-0.5 size-5 shrink-0', s.done ? 'text-emerald-400' : 'text-white/35')}
                            aria-hidden
                          />
                          <div>
                            <p className="text-[13px] font-medium text-white">{s.title}</p>
                            <p className="text-[12px] leading-relaxed text-white/50">{s.detail}</p>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-center text-[11px] text-white/35">
                    <a href="#/emergency" className="text-sky-400/90 underline-offset-2 hover:underline" onClick={onClose}>
                      Ops console
                    </a>
                  </p>
                </>
              ) : null}

              <Button
                type="button"
                variant="secondary"
                className="w-full border-white/15 bg-white/8 text-white hover:bg-white/12"
                onClick={onClose}
              >
                <X className="mr-2 size-4" />
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
