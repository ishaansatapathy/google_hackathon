export type SosSimTick = {
  type: 'sos_tick'
  userLat: number
  userLng: number
  responderLat: number
  responderLng: number
  distanceM: number
  etaSec: number
  progress: number
  ts: number
}

type LatLng = { lat: number; lng: number }

export function haversineM(a: LatLng, b: LatLng) {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(Math.min(1, x)))
}

export function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }
}

function polylineLengthM(points: LatLng[]): number {
  let sum = 0
  for (let i = 1; i < points.length; i++) {
    sum += haversineM(points[i - 1], points[i])
  }
  return sum
}

/** `t` in [0,1] along polyline from first point to last. */
export function pointAtRouteProgress(points: LatLng[], t: number): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 }
  if (points.length === 1) return points[0]
  const tt = Math.max(0, Math.min(1, t))
  const total = polylineLengthM(points)
  if (total <= 0) return points[points.length - 1]
  const target = tt * total
  let acc = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const segLen = haversineM(a, b)
    if (acc + segLen >= target - 1e-6 || i === points.length - 1) {
      const localT = segLen <= 1e-6 ? 0 : (target - acc) / segLen
      const u = Math.max(0, Math.min(1, localT))
      return interpolate(a, b, u)
    }
    acc += segLen
  }
  return points[points.length - 1]
}

export function routeTuplesToLatLng(tuples: [number, number][]): LatLng[] {
  return tuples.map(([lat, lng]) => ({ lat, lng }))
}

/** Responder starts offset from user (same as demo WS server). */
export function responderStartPoint(userLat: number, userLng: number) {
  return { lat: userLat + 0.007, lng: userLng + 0.0055 }
}

function buildTick(user: LatLng, pos: LatLng, t: number): SosSimTick {
  const d = haversineM(pos, user)
  const etaSec = Math.max(0, Math.round((1 - t) * 140))
  return {
    type: 'sos_tick',
    userLat: user.lat,
    userLng: user.lng,
    responderLat: pos.lat,
    responderLng: pos.lng,
    distanceM: Math.round(d),
    etaSec,
    progress: Math.round(t * 1000) / 1000,
    ts: Date.now(),
  }
}

export function computeResponderTick(
  userLat: number,
  userLng: number,
  step: number,
  maxTicks: number,
): SosSimTick {
  const user = { lat: userLat, lng: userLng }
  const start = responderStartPoint(userLat, userLng)
  const t = Math.min(1, step / maxTicks)
  const pos = interpolate(start, user, t)
  return buildTick(user, pos, t)
}

export function computeResponderTickAlongRoute(
  routeTuples: [number, number][] | null,
  userLat: number,
  userLng: number,
  step: number,
  maxTicks: number,
): SosSimTick {
  const user = { lat: userLat, lng: userLng }
  const t = Math.min(1, step / maxTicks)
  let pos: LatLng
  if (routeTuples && routeTuples.length >= 2) {
    const pts = routeTuplesToLatLng(routeTuples)
    pos = pointAtRouteProgress(pts, t)
  } else {
    const start = responderStartPoint(userLat, userLng)
    pos = interpolate(start, user, t)
  }
  return buildTick(user, pos, t)
}
