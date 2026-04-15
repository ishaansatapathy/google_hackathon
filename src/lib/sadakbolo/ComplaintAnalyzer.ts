import { calculateSeverity } from '@/lib/sadakbolo/SeverityCalculator'
import { checkDuplicate } from '@/lib/sadakbolo/DuplicateChecker'
import { estimateResolutionDays } from '@/lib/sadakbolo/ResolutionEstimator'
import type { AnalysisResult, IssueType, Priority, SadakReport } from '@/lib/sadakbolo/types'

const URGENT = /\b(urgent|danger|help|emergency|critical|immediately|asap)\b/i

export function hasUrgentKeywords(text: string): boolean {
  return URGENT.test(text)
}

/** Keyword-first classification; fallback uses deterministic variety from text hash. */
export function classifyIssue(text: string, imageFileName: string | null): IssueType {
  const blob = `${text} ${imageFileName ?? ''}`.toLowerCase()

  if (/(accident|crash|collision|hit\s+and|vehicle\s+hit)/.test(blob)) return 'accident'
  if (/(pothole|gaddha|poth|crack|uneven|dip)/.test(blob)) return 'pothole'
  if (/(water\s*log|waterlogging|flood|stagnant|drain|sewage|rain)/.test(blob)) return 'waterlogging'
  if (/(signal|traffic\s*light|broken\s*light|not\s*working)/.test(blob)) return 'broken_signal'
  if (/(traffic|jam|congestion|gridlock|block)/.test(blob)) return 'traffic'

  const pool: IssueType[] = ['pothole', 'waterlogging', 'broken_signal', 'traffic', 'accident']
  const idx = Math.abs(hashString(text || imageFileName || 'x')) % pool.length
  return pool[idx]!
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return h
}

function priorityFrom(severity: number, urgent: boolean): Priority {
  if (urgent) return 'High'
  if (severity >= 8) return 'High'
  if (severity >= 5) return 'Medium'
  return 'Low'
}

export type AnalyzeInput = {
  text: string
  imageFileName: string | null
  /** Simulated voice added this text */
  voiceSimulated: boolean
  lat: number
  lng: number
  existingReports: SadakReport[]
}

/**
 * Rule-based + light randomness (seeded by text) — simulates an "AI" triage pipeline.
 */
export function analyzeComplaint(input: AnalyzeInput): AnalysisResult {
  const combined = input.voiceSimulated ? `${input.text} [voice]` : input.text
  const issueType = classifyIssue(combined, input.imageFileName)
  const urgent = hasUrgentKeywords(combined)
  const severityScore = calculateSeverity(issueType, combined, urgent)
  const priority = priorityFrom(severityScore, urgent)
  const dup = checkDuplicate(input.lat, input.lng, issueType, input.existingReports)
  const estimatedDays = estimateResolutionDays(priority)

  return {
    issueType,
    severityScore,
    priority,
    duplicateFound: dup.duplicateFound,
    duplicateMessage: dup.message,
    estimatedDays,
  }
}
