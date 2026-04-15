import { useEffect, useState } from 'react'
import { Navigation2, TrendingUp, Users } from 'lucide-react'

import { FriendlyNeighbourhoodPanel } from '@/components/commute/FriendlyNeighbourhoodPanel'
import { CommuteLocationPicker } from '@/components/commute/CommuteLocationPicker'
import { SadakBolo } from '@/components/sadakbolo/SadakBolo'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommuteDrivingRouteProvider } from '@/context/CommuteDrivingRouteContext'
import { CommuteLocationsProvider, useCommuteLocations } from '@/context/CommuteLocationsContext'
import { useCommuteWebSocket } from '@/hooks/useCommuteWebSocket'
import { useHashRoute } from '@/hooks/useHashRoute'
import { fetchComplaints } from '@/lib/sadakbolo/api'
import type { SadakReport } from '@/lib/sadakbolo/types'
import { cn } from '@/lib/utils'

import { RouteCorridorHintsPanel } from './RouteCorridorHintsPanel'
import { CongestionPredictorTab } from './CongestionPredictorTab'
import { RoutesTab } from '../safety-map/RoutesTab'

const T = {
  congestion: 'congestion',
  routes: 'routes',
} as const

function CommuteHubInner() {
  const route = useHashRoute()
  const mode = route.page === 'commute' ? route.commute : 'hub'
  const isHub = mode === 'hub'

  const { from, to } = useCommuteLocations()
  const [tab, setTab] = useState<string>(T.congestion)
  const [sadakReports, setSadakReports] = useState<SadakReport[]>([])
  const { status, corridors, lastSnapshotTs, trafficRouteEvent } = useCommuteWebSocket(isHub)

  useEffect(() => {
    void fetchComplaints().then(setSadakReports)
  }, [])

  const reportLat = (from.lat + to.lat) / 2
  const reportLng = (from.lng + to.lng) / 2
  const reportLabel = 'Midpoint of your From → To route (demo anchor)'

  const sectionPad = isHub
    ? 'px-8 py-16 md:px-16 md:py-24'
    : 'py-16 pr-8 pl-44 pt-16 md:py-24 md:pr-16 md:pl-52'

  return (
    <section id="commute-section" className={cn('scroll-mt-4 border-t border-white/8 bg-black', sectionPad)}>
      <div className="mx-auto max-w-6xl">
        <nav
          className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4"
          aria-label="Commute views"
        >
          <a
            href="#/commute"
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              isHub
                ? 'border-[#EE3F2C] bg-[#EE3F2C] text-white'
                : 'border-white/20 bg-black/40 text-white/70 hover:border-white/35 hover:text-white',
            )}
          >
            <TrendingUp className="size-4 shrink-0 opacity-90" />
            Commute
          </a>
          <a
            href="#/commute/neighbourhood"
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              !isHub
                ? 'border-emerald-500 bg-emerald-600 text-white'
                : 'border-white/20 bg-black/40 text-white/70 hover:border-emerald-500/50 hover:text-white',
            )}
          >
            <Users className="size-4 shrink-0 opacity-90" />
            Friendly neighbourhood
          </a>
        </nav>

        {isHub ? (
          <>
          <div className="flex flex-col gap-10 md:gap-12">
            <header className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#EE3F2C]">
                Urban commute intelligence
              </p>
              <h2 className="max-w-3xl font-sans text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Real-time congestion predictor
              </h2>
              <p className="max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-base">
                One trip definition for congestion scores and multi-mode routing — simulated sensors,
                lookahead, and route risk overlays (demo).
              </p>
            </header>

            <CommuteLocationPicker />

            <RouteCorridorHintsPanel />

            <Tabs
              value={tab}
              onValueChange={(v) => setTab(String(v))}
              className="w-full gap-4"
            >
              <TabsList variant="line" className="h-auto w-full flex-wrap justify-start gap-1 bg-white/4 p-1">
                <TabsTrigger value={T.congestion} className="gap-1.5 px-3 py-2">
                  <TrendingUp className="size-4" />
                  Congestion
                </TabsTrigger>
                <TabsTrigger value={T.routes} className="gap-1.5 px-3 py-2">
                  <Navigation2 className="size-4" />
                  Routes
                </TabsTrigger>
              </TabsList>

              <TabsContent value={T.congestion} keepMounted className="mt-4 outline-none">
                <CongestionPredictorTab
                  corridors={corridors}
                  lastSnapshotTs={lastSnapshotTs}
                  wsStatus={status}
                />
              </TabsContent>

              <TabsContent value={T.routes} keepMounted className="mt-4 outline-none">
                <RoutesTab
                  trafficRouteEvent={trafficRouteEvent}
                  isActive={tab === T.routes}
                  sadakReports={sadakReports}
                />
              </TabsContent>
            </Tabs>
          </div>
          <SadakBolo
            reportLat={reportLat}
            reportLng={reportLng}
            locationLabel={reportLabel}
            existingReports={sadakReports}
            onSubmitted={(r) => setSadakReports((prev) => [...prev, r])}
          />
          </>
        ) : (
          <div className="flex flex-col gap-10 md:gap-12">
            <header className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400/95">
                Community
              </p>
              <h2 className="max-w-3xl font-sans text-3xl font-semibold tracking-tight text-white md:text-4xl">
                Friendly neighbourhood
              </h2>
              <p className="max-w-2xl text-[15px] leading-relaxed text-white/70 md:text-base">
                Same From / To as anywhere else — find simulated corridor overlap and send a ride
                request instead of a solo cab (demo).
              </p>
            </header>

            <CommuteLocationPicker />

            <FriendlyNeighbourhoodPanel />
          </div>
        )}
      </div>
    </section>
  )
}

export function CommuteHub() {
  return (
    <CommuteLocationsProvider>
      <CommuteDrivingRouteProvider>
        <CommuteHubInner />
      </CommuteDrivingRouteProvider>
    </CommuteLocationsProvider>
  )
}
