import { useState } from 'react'
import { Navigation2, TrendingUp, Users } from 'lucide-react'

import { FriendlyNeighbourhoodPanel } from '@/components/commute/FriendlyNeighbourhoodPanel'
import { CommuteLocationPicker } from '@/components/commute/CommuteLocationPicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CommuteLocationsProvider } from '@/context/CommuteLocationsContext'
import { useCommuteWebSocket } from '@/hooks/useCommuteWebSocket'
import { useHashRoute } from '@/hooks/useHashRoute'
import { cn } from '@/lib/utils'

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

  const [tab, setTab] = useState<string>(T.congestion)
  const { status, corridors, lastSnapshotTs, trafficRouteEvent } = useCommuteWebSocket(isHub)

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
                />
              </TabsContent>
            </Tabs>
          </div>
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
      <CommuteHubInner />
    </CommuteLocationsProvider>
  )
}
