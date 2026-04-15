/** Client-side “ML” helpers for Jaam — no external model calls. */

export type SentimentLabel = 'angry' | 'frustrated' | 'neutral'

const angryWords = ['stupid', 'idiot', 'useless', 'bakwaas', 'bekar', 'hate']
const frustratedWords = ['kitna', 'kab', 'tired', 'bore', 'ugh', 'argh']

export function predictJamDuration(
  hour: number,
  dayOfWeek: number,
  weather: string,
  _location: string,
): number {
  const baseDuration = 20
  const isRainy = /rain/i.test(weather)
  const isMonday = dayOfWeek === 1
  const timeMultiplier = hour >= 8 && hour <= 10 ? 1.8 : 1.0
  const weatherMultiplier = isRainy ? 1.4 : 1.0
  const dayMultiplier = isMonday ? 1.3 : 1.0
  return Math.round(baseDuration * timeMultiplier * weatherMultiplier * dayMultiplier)
}

export function checkSentiment(message: string): SentimentLabel {
  const lower = message.toLowerCase()
  if (angryWords.some((w) => lower.includes(w))) return 'angry'
  if (frustratedWords.some((w) => lower.includes(w))) return 'frustrated'
  return 'neutral'
}
