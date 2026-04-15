import { ArrowLeft } from 'lucide-react'

import { AuthHeaderChrome } from '@/components/auth/AuthHeaderChrome'
import { CongestionLiveStrip } from '@/components/commute/CongestionLiveStrip'
import { HeroMascot } from '@/components/HeroMascot'
import { SosHeaderButton } from '@/components/SosHeaderButton'
import { TargoLogo } from '@/components/TargoLogo'
import { SiteFooter } from '@/components/sections/SiteFooter'
import { SafetyMap } from '@/components/safety-map/SafetyMap'
import { Button } from '@/components/ui/button'
import { CLIP_BTN } from '@/lib/targo'
import { setHash } from '@/lib/hashRoute'
import { useHashRoute } from '@/hooks/useHashRoute'

export function CommutePage() {
  const route = useHashRoute()
  const isNeighbourhood = route.page === 'commute' && route.commute === 'neighbourhood'

  return (
    <div className="min-h-svh bg-black font-sans antialiased">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/90 px-6 py-4 backdrop-blur-md md:px-12">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => setHash({ page: 'home', tab: 'features' })}
            >
              <ArrowLeft className="mr-1.5 size-4" />
              Home
            </Button>
            <span className="hidden h-4 w-px bg-white/15 sm:block" aria-hidden />
            <TargoLogo />
          </div>
          <p className="max-w-md text-right text-xs text-white/50">
            {isNeighbourhood
              ? 'Friendly neighbourhood — same-route ride match (sim)'
              : 'Commute — congestion & routes'}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <AuthHeaderChrome compact />
            <SosHeaderButton className="text-xs" />
            <a
              href="#/home/features"
              className="hidden px-4 py-2 text-xs font-semibold text-white sm:inline-block"
              style={{ backgroundColor: '#EE3F2C', clipPath: CLIP_BTN }}
            >
              Back to site
            </a>
          </div>
        </div>
      </header>

      {!isNeighbourhood ? <CongestionLiveStrip /> : null}

      {isNeighbourhood ? <HeroMascot /> : null}

      <main className="pb-8">
        <SafetyMap />
      </main>

      <SiteFooter />
    </div>
  )
}
