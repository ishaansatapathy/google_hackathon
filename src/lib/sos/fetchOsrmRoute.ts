/**
 * Public OSRM demo — road geometry (not for production traffic).
 * https://project-osrm.org/
 */

export type LatLngTuple = [number, number]

export async function fetchOsrmDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<LatLngTuple[]> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error('osrm_http')
  const data = (await res.json()) as {
    routes?: Array<{ geometry?: { coordinates?: [number, number][] } }>
  }
  const coords = data?.routes?.[0]?.geometry?.coordinates
  if (!Array.isArray(coords) || coords.length < 2) throw new Error('osrm_empty')
  return coords.map(([lng, lat]) => [lat, lng] as LatLngTuple)
}
