/** SadakBolo — simulated civic complaint pipeline (no real ML). */

export type IssueType = 'pothole' | 'waterlogging' | 'broken_signal' | 'traffic' | 'accident'

export type Priority = 'Low' | 'Medium' | 'High'

export type SadakReport = {
  id: string
  lat: number
  lng: number
  type: IssueType
  severity: number
  priority: Priority
  timestamp: number
  text?: string
}

export type AnalysisResult = {
  issueType: IssueType
  severityScore: number
  priority: Priority
  duplicateFound: boolean
  duplicateMessage: string | null
  estimatedDays: number
}
