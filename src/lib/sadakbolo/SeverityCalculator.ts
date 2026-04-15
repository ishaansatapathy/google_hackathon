import type { IssueType } from '@/lib/sadakbolo/types'

/** Deterministic pseudo-random 0..max from string seed (stable across runs for same text). */
function seededNoise(seed: string, max: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  return Math.abs(h) % (max + 1)
}

/**
 * Severity 1–10 from issue type + optional urgency boost.
 * accident → 8–10, pothole → 4–7, waterlogging → 5–8, traffic → 3–6, broken_signal → 4–7
 */
export function calculateSeverity(issueType: IssueType, textSeed: string, urgentBoost: boolean): number {
  const s = textSeed || 'seed'
  let min = 4
  let max = 7

  switch (issueType) {
    case 'accident':
      min = 8
      max = 10
      break
    case 'pothole':
      min = 4
      max = 7
      break
    case 'waterlogging':
      min = 5
      max = 8
      break
    case 'traffic':
      min = 3
      max = 6
      break
    case 'broken_signal':
      min = 4
      max = 7
      break
    default:
      break
  }

  const span = max - min
  const base = min + seededNoise(s, span)
  const boosted = urgentBoost ? Math.min(10, base + 1) : base
  return Math.max(1, Math.min(10, boosted))
}
