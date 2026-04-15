/**
 * Dummy “real-time” congestion index for Bengaluru (0–100).
 * Mirrors the synthetic process in `scripts/train_congestion_dummy.py` (sklearn baseline).
 * No paid APIs — safe for hackathon demos.
 */

export function predictCityCongestionIndex(now: Date = new Date()): number {
  const h = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600
  const dow = now.getDay()
  const isWeekend = dow === 0 || dow === 6

  const phase = (h / 24) * 2 * Math.PI
  const daily = 48 + 26 * Math.sin(phase - 0.4) + 6 * Math.sin(2 * phase)
  const week = isWeekend ? -10 : 11
  const micro = 4 * Math.sin(now.getTime() / 120000)

  const raw = daily + week + micro
  return Math.round(Math.min(100, Math.max(0, raw)))
}

export function congestionBand(score: number): 'danger' | 'caution' | 'safe' {
  if (score >= 67) return 'danger'
  if (score >= 34) return 'caution'
  return 'safe'
}

export function congestionLabelEn(score: number): string {
  if (score >= 72) return 'Heavy congestion (sim)'
  if (score >= 45) return 'Moderate · building (sim)'
  return 'Light traffic (sim)'
}
