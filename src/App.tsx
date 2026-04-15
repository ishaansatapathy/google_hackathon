import { useEffect, useState } from 'react'
import { BadgeInfo, Contact, Sparkles } from 'lucide-react'

import { TargoHero } from '@/components/TargoHero'
import { AboutSection } from '@/components/sections/AboutSection'
import { ContactSection } from '@/components/sections/ContactSection'
import { FeaturesIntroSection } from '@/components/sections/FeaturesIntroSection'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { SiteFooter } from '@/components/sections/SiteFooter'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useHashRoute } from '@/hooks/useHashRoute'
import { setHash, type HomeTab } from '@/lib/hashRoute'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { CommutePage } from '@/pages/CommutePage'
import { JaamPage } from '@/pages/JaamPage'
import { EmergencyServicesPage } from '@/pages/EmergencyServicesPage'

const PAGE_TABS = {
  features: 'features',
  about: 'about',
  contact: 'contact',
} as const

function homeTabToKey(tab: HomeTab): string {
  return tab
}

function keyToHomeTab(key: string): HomeTab {
  if (key === 'about' || key === 'contact' || key === 'features') return key
  return 'features'
}

function App() {
  const route = useHashRoute()
  const [pageTab, setPageTab] = useState<string>(PAGE_TABS.features)

  const homeTab = route.page === 'home' ? route.tab : null
  useEffect(() => {
    if (homeTab === null) return
    setPageTab(homeTabToKey(homeTab))
  }, [route.page, homeTab])

  if (route.page === 'commute') {
    return (
      <RequireAuth>
        <CommutePage />
      </RequireAuth>
    )
  }

  if (route.page === 'emergency') {
    return (
      <RequireAuth>
        <EmergencyServicesPage />
      </RequireAuth>
    )
  }

  if (route.page === 'jaam') {
    return (
      <RequireAuth>
        <JaamPage />
      </RequireAuth>
    )
  }

  return (
    <div className="min-h-svh bg-black font-sans antialiased">
      <TargoHero />
      <section
        id="workspace"
        className="border-t border-white/8 bg-black px-8 py-10 md:px-16 md:py-14"
      >
        <div className="mx-auto max-w-6xl">
          <Tabs
            value={pageTab}
            onValueChange={(v) => {
              const key = String(v)
              setPageTab(key)
              setHash({ page: 'home', tab: keyToHomeTab(key) })
            }}
          >
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap justify-start gap-1 bg-white/4 p-1"
            >
              <TabsTrigger value={PAGE_TABS.features} className="gap-1.5 px-3 py-2">
                <Sparkles className="size-4" />
                Features
              </TabsTrigger>
              <TabsTrigger value={PAGE_TABS.about} className="gap-1.5 px-3 py-2">
                <BadgeInfo className="size-4" />
                About
              </TabsTrigger>
              <TabsTrigger value={PAGE_TABS.contact} className="gap-1.5 px-3 py-2">
                <Contact className="size-4" />
                Contact
              </TabsTrigger>
            </TabsList>

            <TabsContent value={PAGE_TABS.features} keepMounted className="mt-6 flex flex-col gap-14 md:gap-20">
              <FeaturesIntroSection />
              <ServicesSection />
            </TabsContent>
            <TabsContent value={PAGE_TABS.about} keepMounted className="mt-6">
              <AboutSection />
            </TabsContent>
            <TabsContent value={PAGE_TABS.contact} keepMounted className="mt-6">
              <ContactSection />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}

export default App
