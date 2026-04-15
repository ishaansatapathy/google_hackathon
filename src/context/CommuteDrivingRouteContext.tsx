import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type Ctx = {
  /** Latest driving route geometry from OSRM (Routes tab), or null if not calculated / pins moved */
  drivingCoordinates: [number, number][] | null
  setDrivingCoordinates: (c: [number, number][] | null) => void
}

const CommuteDrivingRouteContext = createContext<Ctx | null>(null)

export function CommuteDrivingRouteProvider({ children }: { children: ReactNode }) {
  const [drivingCoordinates, setDrivingCoordinates] = useState<[number, number][] | null>(null)

  const setDrivingCoordinatesStable = useCallback((c: [number, number][] | null) => {
    setDrivingCoordinates(c)
  }, [])

  const value = useMemo(
    () => ({
      drivingCoordinates,
      setDrivingCoordinates: setDrivingCoordinatesStable,
    }),
    [drivingCoordinates, setDrivingCoordinatesStable],
  )

  return (
    <CommuteDrivingRouteContext.Provider value={value}>{children}</CommuteDrivingRouteContext.Provider>
  )
}

export function useCommuteDrivingRoute(): Ctx {
  const c = useContext(CommuteDrivingRouteContext)
  if (!c) throw new Error('useCommuteDrivingRoute must be used inside CommuteDrivingRouteProvider')
  return c
}
