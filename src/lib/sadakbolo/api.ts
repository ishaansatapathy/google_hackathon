import type { SadakReport } from '@/lib/sadakbolo/types'

const PATH = '/api/sadakbolo/complaints'
const LS_KEY = 'sadakbolo-reports'

function readLocal(): SadakReport[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as SadakReport[]) : []
  } catch {
    return []
  }
}

function writeLocal(reports: SadakReport[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(reports))
  } catch {
    /* ignore quota */
  }
}

/** GET — server when dev proxy + sadakbolo-http runs; else localStorage. */
export async function fetchComplaints(): Promise<SadakReport[]> {
  try {
    const res = await fetch(PATH)
    if (!res.ok) throw new Error(String(res.status))
    const data = (await res.json()) as unknown
    if (Array.isArray(data)) {
      writeLocal(data as SadakReport[])
      return data as SadakReport[]
    }
  } catch {
    /* fallback */
  }
  return readLocal()
}

/** POST — append on server or localStorage. */
export async function saveComplaint(report: SadakReport): Promise<void> {
  try {
    const res = await fetch(PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    if (!res.ok) throw new Error(String(res.status))
    return
  } catch {
    const prev = readLocal()
    writeLocal([...prev, report])
  }
}
