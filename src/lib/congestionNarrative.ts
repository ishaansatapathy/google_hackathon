import type { CorridorPredictionWithAnomaly, MetroCity, Recommendation } from '@/lib/congestionEngine'

/**
 * User-facing Claude prompt for congestion copy — stresses demo / simulated data.
 */
export function buildCongestionNarrativePrompt(params: {
  city: MetroCity
  departureIso: string
  fromLabel: string
  toLabel: string
  rec: Recommendation
  predictions: CorridorPredictionWithAnomaly[]
}): string {
  if (params.predictions.length === 0) {
    return `You help commuters in India understand a DEMONSTRATION congestion dashboard (not live government data).

Metro: ${params.city}
Departure: ${params.departureIso}
Trip: ${params.fromLabel} → ${params.toLabel}
No corridor rows loaded yet — say one short sentence to set From/To and pick a metro.

Recommendation: ${params.rec.detail}

Write 2 short sentences in India English. Demo only.`
  }

  const worst = params.predictions.reduce((a, b) => {
    const ma = Math.max(a.now, a.t15, a.t30)
    const mb = Math.max(b.now, b.t15, b.t30)
    return mb > ma ? b : a
  }, params.predictions[0]!)

  const lines = params.predictions
    .map(
      (p) =>
        `- ${p.name}: now=${p.now.toFixed(0)}, +15min=${p.t15.toFixed(0)}, +30min=${p.t30.toFixed(0)} (simulated anomaly vs mock baseline: ${p.anomaly})`,
    )
    .join('\n')

  const recTitle =
    params.rec.headline === 'leave_now'
      ? 'Leave now'
      : params.rec.headline === 'wait'
        ? `Wait ~${params.rec.waitMinutes ?? 20} min`
        : 'Take alternate route'

  return `You help commuters in India understand a DEMONSTRATION congestion dashboard (not live government or traffic-police data).

Metro: ${params.city}
Departure window (local): ${params.departureIso}
Trip: ${params.fromLabel} → ${params.toLabel}

Simulated corridor scores (0–100, demo formula):
${lines || '—'}

Worst stretch (max window): ${worst?.name ?? 'n/a'}
App recommendation headline: ${recTitle}
Recommendation detail: ${params.rec.detail}

Write 2–4 short sentences in clear India English. Mention it is a demo/simulation. Do not claim real-time authority data or exact jam times. Be practical and friendly. No bullet points.`
}
