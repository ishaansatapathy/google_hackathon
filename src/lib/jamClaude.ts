/**
 * Anthropic Messages API — key via `VITE_ANTHROPIC_API_KEY` (never commit real keys).
 * Note: calling Anthropic from the browser may be blocked by CORS; use a dev proxy or
 * a small backend in production if requests fail in the network tab.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

export function stripJsonFences(raw: string): string {
  let t = raw.trim()
  if (t.startsWith('```')) {
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '')
  }
  return t.trim()
}

export async function callClaudeText(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY')
  }
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(errText || `HTTP ${res.status}`)
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>
  }
  const text = data.content?.find((c) => c.type === 'text')?.text
  if (!text) throw new Error('No text in response')
  return text
}

export async function callClaudeJson<T>(prompt: string): Promise<T> {
  const text = await callClaudeText(prompt)
  const cleaned = stripJsonFences(text)
  return JSON.parse(cleaned) as T
}
