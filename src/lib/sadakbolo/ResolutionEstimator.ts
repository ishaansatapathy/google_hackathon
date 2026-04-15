import type { Priority } from '@/lib/sadakbolo/types'

/**
 * Mock SLA: Low → 5 days, Medium → 3 days, High → 1 day.
 * Severity nudges slightly when priority is borderline (handled upstream).
 */
export function estimateResolutionDays(priority: Priority): number {
  switch (priority) {
    case 'High':
      return 1
    case 'Medium':
      return 3
    case 'Low':
    default:
      return 5
  }
}
