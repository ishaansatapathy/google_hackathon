import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import type { LatLng } from '@/lib/osrmRoutes'

export const DEFAULT_COMMUTE_FROM: LatLng = { lat: 19.076, lng: 72.8777 }
export const DEFAULT_COMMUTE_TO: LatLng = { lat: 19.1136, lng: 72.8697 }

export type PickMode = 'none' | 'from' | 'to'

type Ctx = {
  from: LatLng
  to: LatLng
  setFrom: (p: LatLng) => void
  setTo: (p: LatLng) => void
  pickMode: PickMode
  setPickMode: (m: PickMode) => void
  setFromGeolocation: () => void
  geoError: string | null
  clearGeoError: () => void
}

const CommuteLocationsContext = createContext<Ctx | null>(null)

export function CommuteLocationsProvider({ children }: { children: ReactNode }) {
  const [from, setFrom] = useState<LatLng>(DEFAULT_COMMUTE_FROM)
  const [to, setTo] = useState<LatLng>(DEFAULT_COMMUTE_TO)
  const [pickMode, setPickMode] = useState<PickMode>('none')
  const [geoError, setGeoError] = useState<string | null>(null)

  const setFromGeolocation = useCallback(() => {
    setGeoError(null)
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFrom({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setPickMode('none')
      },
      () => setGeoError('Location denied or unavailable'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  const clearGeoError = useCallback(() => setGeoError(null), [])

  const value = useMemo(
    () => ({
      from,
      to,
      setFrom,
      setTo,
      pickMode,
      setPickMode,
      setFromGeolocation,
      geoError,
      clearGeoError,
    }),
    [from, to, pickMode, geoError, setFromGeolocation, clearGeoError],
  )

  return (
    <CommuteLocationsContext.Provider value={value}>{children}</CommuteLocationsContext.Provider>
  )
}

export function useCommuteLocations(): Ctx {
  const c = useContext(CommuteLocationsContext)
  if (!c) throw new Error('useCommuteLocations must be used inside CommuteLocationsProvider')
  return c
}
