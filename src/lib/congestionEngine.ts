/**
 * Simulated urban congestion model — metro peak patterns + simple lookahead.
 * Not ML: weighted blend + time-of-day multipliers (demo / hackathon).
 */

export type MetroCity = 'Mumbai' | 'Delhi' | 'Bangalore'

export interface CorridorDef {
  id: string
  name: string
  city: MetroCity
  /** Named alternate for recommendation copy */
  alternateVia: string
}

export const CORRIDORS: CorridorDef[] = [
  {
    id: 'mum_weh',
    name: 'Western Express Highway',
    city: 'Mumbai',
    alternateVia: 'SV Road / Link Road',
  },
  {
    id: 'mum_eh',
    name: 'Eastern Freeway',
    city: 'Mumbai',
    alternateVia: 'P D’Mello Road',
  },
  {
    id: 'del_ring',
    name: 'Ring Road (Outer)',
    city: 'Delhi',
    alternateVia: 'Inner Ring / Barapullah',
  },
  {
    id: 'del_nh48',
    name: 'NH48 (Gurugram corridor)',
    city: 'Delhi',
    alternateVia: 'Dwarka Expressway',
  },
  {
    id: 'blr_orr',
    name: 'Outer Ring Road',
    city: 'Bangalore',
    alternateVia: 'NICE Road / service lanes',
  },
]

export interface CorridorSensors {
  id: string
  vehicleCount: number
  speedKmh: number
  /** 0–1 */
  density: number
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

/** Minutes since local midnight for a Date */
export function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Peak bands: morning 8–10, evening 17–20 (metro-style).
 * Returns multiplier 0.75 – 1.45
 */
export function timeOfDayMultiplier(minutesSinceMidnight: number): number {
  const m = minutesSinceMidnight
  const morningPeak = m >= 8 * 60 && m < 10 * 60
  const eveningPeak = m >= 17 * 60 && m < 20 * 60
  const shoulderAm = m >= 7 * 60 && m < 8 * 60
  const shoulderPm = m >= 10 * 60 && m < 12 * 60
  const shoulderEv = m >= 16 * 60 && m < 17 * 60
  const lateNight = m < 5 * 60 || m >= 23 * 60

  if (morningPeak || eveningPeak) return 1.38
  if (shoulderAm || shoulderPm || shoulderEv) return 1.12
  if (lateNight) return 0.78
  return 0.95
}

/** Historical peak factor (weekday assumption for demo) */
export function historicalPeakFactor(minutesSinceMidnight: number): number {
  const m = minutesSinceMidnight
  if ((m >= 8 * 60 && m < 10 * 60) || (m >= 17 * 60 && m < 20 * 60)) return 1.22
  return 1.0
}

export function scoreFromSensors(s: CorridorSensors): number {
  const vPart = clamp(s.vehicleCount / 18, 0, 100) * 0.38
  const speedPart = clamp((80 - s.speedKmh) / 80, 0, 1) * 100 * 0.36
  const densityPart = s.density * 100 * 0.26
  return clamp(vPart + speedPart + densityPart, 0, 100)
}

/** Simulated anomaly vs a mock hourly baseline — not trained on real traffic. */
export type AnomalyLevel = 'none' | 'elevated' | 'severe'

export interface CorridorPrediction {
  id: string
  name: string
  city: MetroCity
  alternateVia: string
  now: number
  t15: number
  t30: number
  severity: 'low' | 'moderate' | 'high'
}

export interface CorridorPredictionWithAnomaly extends CorridorPrediction {
  anomaly: AnomalyLevel
  /** Mock “typical” score for this corridor + hour — demo only */
  mockBaseline: number
  /** Average of now / +15 / +30 used vs baseline */
  blendedObserved: number
}

/**
 * Mock hourly baseline per corridor (deterministic hash + hour bucket).
 * Simulated baseline for demo — not trained on real traffic.
 */
export function mockHourlyBaseline(corridorId: string, hour: number): number {
  let h = 0
  for (let i = 0; i < corridorId.length; i++) h = (Math.imul(31, h) + corridorId.charCodeAt(i)) | 0
  const mix = (Math.abs(h) + hour * 13) % 26
  return 36 + mix
}

function anomalyFromBlended(blended: number, baseline: number): AnomalyLevel {
  const excess = Math.max(0, blended - baseline)
  const sigma = 10
  const zLike = excess / sigma
  if (zLike < 0.85) return 'none'
  if (zLike < 1.65) return 'elevated'
  return 'severe'
}

/** Attach z-score-like anomaly flags vs mock baseline (same formula scores, demo statistics). */
export function augmentPredictionsWithAnomaly(
  preds: CorridorPrediction[],
  departure: Date,
): CorridorPredictionWithAnomaly[] {
  const hour = departure.getHours()
  return preds.map((p) => {
    const blendedObserved = (p.now + p.t15 + p.t30) / 3
    const mockBaseline = mockHourlyBaseline(p.id, hour)
    return {
      ...p,
      blendedObserved,
      mockBaseline,
      anomaly: anomalyFromBlended(blendedObserved, mockBaseline),
    }
  })
}

export function aggregateAnomalyLevel(preds: CorridorPredictionWithAnomaly[]): AnomalyLevel {
  if (preds.some((x) => x.anomaly === 'severe')) return 'severe'
  if (preds.some((x) => x.anomaly === 'elevated')) return 'elevated'
  return 'none'
}

function severity(score: number): 'low' | 'moderate' | 'high' {
  if (score < 45) return 'low'
  if (score < 72) return 'moderate'
  return 'high'
}

export function buildPredictions(
  sensors: CorridorSensors[],
  departure: Date,
): CorridorPrediction[] {
  const depMin = minutesSinceMidnight(departure)
  const d15 = new Date(departure.getTime() + 15 * 60 * 1000)
  const d30 = new Date(departure.getTime() + 30 * 60 * 1000)
  const m15 = minutesSinceMidnight(d15)
  const m30 = minutesSinceMidnight(d30)

  return sensors.map((s) => {
    const base = scoreFromSensors(s)
    const def = CORRIDORS.find((c) => c.id === s.id)
    const name = def?.name ?? s.id
    const city = def?.city ?? 'Mumbai'
    const alternateVia = def?.alternateVia ?? 'parallel arterial'

    const peak0 = timeOfDayMultiplier(depMin) * historicalPeakFactor(depMin)
    const peak15 = timeOfDayMultiplier(m15) * historicalPeakFactor(m15)
    const peak30 = timeOfDayMultiplier(m30) * historicalPeakFactor(m30)

    const now = clamp(base * peak0 * 0.92, 0, 100)
    const t15 = clamp(base * peak15 * (0.94 + (s.id.length % 7) * 0.01), 0, 100)
    const t30 = clamp(base * peak30 * (0.96 + (s.id.length % 5) * 0.01), 0, 100)

    const worst = Math.max(now, t15, t30)
    return {
      id: s.id,
      name,
      city,
      alternateVia,
      now,
      t15,
      t30,
      severity: severity(worst),
    }
  })
}

export type ActionKind = 'leave_now' | 'wait' | 'alternate'

export interface Recommendation {
  headline: ActionKind
  detail: string
  waitMinutes?: number
  alternateVia?: string
}

/**
 * Single actionable line from aggregate corridor predictions.
 */
export function recommendAction(
  preds: CorridorPrediction[],
  originLabel: string,
  destinationLabel: string,
  opts?: { tripKm?: number },
): Recommendation {
  const tripKm = opts?.tripKm ?? 0
  const longTrip = tripKm > 18

  if (preds.length === 0) {
    return {
      headline: 'leave_now',
      detail:
        'Pick From / To on the map above, set departure time — we blend live corridor scores for your trip.',
    }
  }

  const worst = preds.slice(1).reduce((best, p) => {
    const mp = Math.max(p.now, p.t15, p.t30)
    const mb = Math.max(best.now, best.t15, best.t30)
    return mp > mb ? p : best
  }, preds[0])
  const avg =
    preds.reduce((s, p) => s + (p.now + p.t15 + p.t30) / 3, 0) / preds.length

  const maxScore = Math.max(...preds.flatMap((p) => [p.now, p.t15, p.t30]))

  if (avg < 42 && maxScore < 62) {
    return {
      headline: 'leave_now',
      detail:
        longTrip && tripKm > 0
          ? `Corridors look reasonable for ~${tripKm.toFixed(0)} km — good window to roll (${originLabel} → ${destinationLabel}).`
          : 'Corridors look fluid for your window — good time to start your trip.',
    }
  }

  if (maxScore >= 82 || worst.severity === 'high') {
    return {
      headline: 'alternate',
      detail: `Heavy load on major links${longTrip ? ` along your ${tripKm.toFixed(0)} km trip` : ''} — avoid the worst stretch if possible.`,
      alternateVia: worst.alternateVia,
    }
  }

  return {
    headline: 'wait',
    detail: longTrip
      ? `Longer trip (~${tripKm.toFixed(0)} km) + rising load — waiting ~20 min may ease congestion on your route.`
      : 'Peak build-up expected in the next 15–30 minutes — short wait may smooth your run.',
    waitMinutes: 20,
  }
}
