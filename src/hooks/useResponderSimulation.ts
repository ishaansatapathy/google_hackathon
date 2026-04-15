import { useEffect, useLayoutEffect, useState } from 'react'

import { computeResponderTickAlongRoute, type SosSimTick } from '@/lib/sos/responderSim'

export type { SosSimTick }

export type ResponderPhase = 'idle' | 'searching' | 'accepted' | 'moving' | 'arrived'

const MAX_TICKS = 48
const TICK_MS = 420
const SEARCH_MS = 1400
const ACCEPT_MS = 2200

/**
 * Responder moves along OSRM polyline when `routeTuples` is set; else straight-line fallback.
 */
export function useResponderSimulation(
  enabled: boolean,
  userLat: number | null,
  userLng: number | null,
  routeTuples: [number, number][] | null,
) {
  const [phase, setPhase] = useState<ResponderPhase>('idle')
  const [tick, setTick] = useState<SosSimTick | null>(null)

  useLayoutEffect(() => {
    if (!enabled || userLat == null || userLng == null) {
      setPhase('idle')
      setTick(null)
      return
    }
    setPhase('searching')
    setTick(null)
  }, [enabled, userLat, userLng, routeTuples])

  useEffect(() => {
    if (!enabled || userLat == null || userLng == null) {
      return
    }

    let cancelled = false
    let intervalId: ReturnType<typeof setInterval> | null = null

    const tSearch = window.setTimeout(() => {
      if (cancelled) return
      setPhase('accepted')
    }, SEARCH_MS)

    const tAccept = window.setTimeout(() => {
      if (cancelled) return
      setPhase('moving')
      let k = 0
      intervalId = window.setInterval(() => {
        if (cancelled) return
        k += 1
        setTick(
          computeResponderTickAlongRoute(routeTuples, userLat, userLng, k, MAX_TICKS),
        )
        if (k >= MAX_TICKS) {
          if (intervalId) window.clearInterval(intervalId)
          intervalId = null
          setPhase('arrived')
        }
      }, TICK_MS)
    }, ACCEPT_MS)

    return () => {
      cancelled = true
      window.clearTimeout(tSearch)
      window.clearTimeout(tAccept)
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [enabled, userLat, userLng, routeTuples])

  return { phase, tick, maxTicks: MAX_TICKS }
}
