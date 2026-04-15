import type { SosSession } from '@/lib/sos/types'

export async function postSosAlert(body: {
  lat?: number | null
  lng?: number | null
  message?: string
}): Promise<{ ok: boolean; session: SosSession }> {
  const res = await fetch('/api/sos/alert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err === 'object' && err && 'error' in err ? String(err.error) : 'SOS relay failed')
  }
  return res.json()
}

export async function fetchSosSessions(): Promise<SosSession[]> {
  const res = await fetch('/api/sos/sessions')
  if (!res.ok) return []
  return res.json()
}
