import { BarChart3, Clock, Radio, Route } from 'lucide-react'

import { FadeIn } from '@/components/FadeIn'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const items = [
  {
    title: 'Corridor load & lookahead',
    desc: 'Simulated vehicle count, speed, and density on major links — scores now, +15 min, and +30 min with peak-hour multipliers.',
    icon: BarChart3,
  },
  {
    title: 'Departure intelligence',
    desc: 'Enter origin, destination, and when you plan to leave — one headline: leave now, wait ~20 minutes, or take a named alternate.',
    icon: Clock,
  },
  {
    title: 'Live WebSocket sensors',
    desc: 'Feed refreshes on a fixed interval to mimic operations rooms — demo only, not authority telemetry.',
    icon: Radio,
  },
  {
    title: 'Multi-mode routes',
    desc: 'Walk, bike, and car paths via OSRM with optional alternate driving legs when the stream flags congestion.',
    icon: Route,
  },
]

export function ServicesSection() {
  return (
    <section
      id="services"
      className="relative isolate scroll-mt-6 rounded-2xl border border-white/10 bg-black px-0 py-14 md:py-16"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />
      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EE3F2C]">
            Product
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-[40px]">
            Real-time urban congestion predictor
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/68 md:text-base">
            Built for commuters in dense metros: simple weighted model, explainable
            numbers, and a single actionable recommendation — not a black-box ML stack.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.06}>
              <Card className="group h-full border-white/10 bg-linear-to-br from-white/6 to-transparent ring-white/10 transition hover:border-[#EE3F2C]/40 hover:ring-[#EE3F2C]/25">
                <CardHeader>
                  <div className="mb-2 flex size-11 items-center justify-center border border-white/15 bg-white/4 text-[#EE3F2C] transition group-hover:border-[#EE3F2C]/40">
                    <item.icon className="size-5" strokeWidth={1.75} />
                  </div>
                  <CardTitle className="font-heading text-base font-semibold uppercase tracking-wide text-white">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    {item.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="h-px w-full bg-linear-to-r from-[#EE3F2C]/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}
