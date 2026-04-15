/** Hash routes: `/#/commute`, `/#/jaam`, `/#/home/...` */

export type HomeTab = 'features' | 'about' | 'contact'

/** `hub` = congestion + routes; `neighbourhood` = same-route rides only */
export type CommuteMode = 'hub' | 'neighbourhood'

export type ParsedHash =
  | { page: 'jaam' }
  | { page: 'emergency' }
  | { page: 'commute'; commute: CommuteMode }
  | { page: 'home'; tab: HomeTab }

const HOME_TABS = new Set<string>(['features', 'about', 'contact'])

function normalizeTab(s: string | undefined): HomeTab {
  if (s && HOME_TABS.has(s)) return s as HomeTab
  return 'features'
}

/** Exported for unit tests and deep links. */
export function parseHash(): ParsedHash {
  const raw = window.location.hash.replace(/^#/, '').trim() || '/home'
  if (
    raw === '/emergency' ||
    raw.startsWith('/emergency/') ||
    raw === '/police' ||
    raw.startsWith('/police/')
  ) {
    return { page: 'emergency' }
  }
  if (raw === '/jaam' || raw.startsWith('/jaam/')) return { page: 'jaam' }
  if (raw === '/map' || raw.startsWith('/map/')) return { page: 'commute', commute: 'hub' }
  if (raw.startsWith('/commute')) {
    const rest = raw.slice('/commute'.length).replace(/^\//, '').replace(/\/$/, '')
    if (rest === 'neighbourhood' || rest.startsWith('neighbourhood/')) {
      return { page: 'commute', commute: 'neighbourhood' }
    }
    return { page: 'commute', commute: 'hub' }
  }
  const m = raw.match(/^\/home(?:\/(\w+))?\/?$/)
  if (m) return { page: 'home', tab: normalizeTab(m[1]) }
  return { page: 'home', tab: 'features' }
}

let cachedHashKey = ''
let cachedParsed: ParsedHash | null = null

export function getHashSnapshot(): ParsedHash {
  const key = typeof window !== 'undefined' ? window.location.hash : ''
  if (key === cachedHashKey && cachedParsed) return cachedParsed
  cachedHashKey = key
  cachedParsed = parseHash()
  return cachedParsed
}

const SERVER_SNAPSHOT: ParsedHash = { page: 'home', tab: 'features' }

export function getHashServerSnapshot(): ParsedHash {
  return SERVER_SNAPSHOT
}

export function setHash(parsed: ParsedHash) {
  if (parsed.page === 'emergency') {
    window.location.hash = '#/emergency'
    return
  }
  if (parsed.page === 'jaam') {
    window.location.hash = '#/jaam'
    return
  }
  if (parsed.page === 'commute') {
    window.location.hash =
      parsed.commute === 'neighbourhood' ? '#/commute/neighbourhood' : '#/commute'
    return
  }
  window.location.hash = `#/home/${parsed.tab}`
}

export function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
