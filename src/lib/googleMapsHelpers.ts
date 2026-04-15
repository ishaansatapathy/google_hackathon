export type GmOverlay = google.maps.Marker | google.maps.Polyline | google.maps.Circle

/** Clear overlay list (Marker, Polyline, Circle). */
export function clearGmOverlays(overlays: GmOverlay[]) {
  for (const o of overlays) {
    o.setMap(null)
  }
  overlays.length = 0
}

export function gmExtendBounds(
  bounds: google.maps.LatLngBounds,
  coords: Iterable<[number, number]>,
) {
  for (const [lat, lng] of coords) {
    bounds.extend({ lat, lng })
  }
}

export function gmFitBounds(
  map: google.maps.Map,
  points: google.maps.LatLngLiteral[],
  padding: number | google.maps.Padding = 48,
) {
  if (points.length === 0) return
  const b = new google.maps.LatLngBounds()
  points.forEach((p) => b.extend(p))
  map.fitBounds(b, padding)
}

/** Simple dashed effect using icon repeat (Google Maps has no stroke dash array). */
export function gmDashedPolyline(
  path: google.maps.LatLngLiteral[],
  strokeColor: string,
  strokeWeight: number,
  strokeOpacity: number,
  map: google.maps.Map,
): google.maps.Polyline {
  return new google.maps.Polyline({
    path,
    strokeOpacity: 0,
    icons: [
      {
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity,
          strokeColor,
          strokeWeight,
          scale: 2.5,
        },
        offset: '0',
        repeat: '14px',
      },
    ],
    map,
  })
}
