import { FadeIn } from '@/components/FadeIn'
import { Separator } from '@/components/ui/separator'

const stats = [
  { label: 'Corridors', value: '5' },
  { label: 'Lookahead', value: '30m' },
  { label: 'Feed', value: '~30s' },
]

export function AboutSection() {
  return (
    <section
      id="about"
      className="scroll-mt-6 border-t border-white/8 bg-[#050505] px-8 py-20 md:px-16 md:py-28"
    >
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EE3F2C]">
            About this build
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-[40px]">
            Honest, explainable commute intelligence
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-white/68 md:text-base">
            We combine synthetic corridor sensors with time-of-day and historical
            peak factors — the same levers planners use in spreadsheets, not opaque
            deep models. The goal is a credible demo for judges: clear inputs,
            visible math, and one decision commuters can act on.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/52">
            Routing uses the public OSRM demo; congestion numbers are simulated and
            do not reflect real roads. Production would plug into probe data or
            agency feeds.
          </p>
        </FadeIn>

        <FadeIn delay={0.12}>
          <div
            className="relative overflow-hidden rounded-xl border border-white/12 p-8 md:p-10"
            style={{
              backdropFilter: 'blur(40px) saturate(180%)',
              WebkitBackdropFilter: 'blur(40px) saturate(180%)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 45%, transparent 55%, rgba(238,63,44,0.08) 100%)',
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.18), inset 0 -2px 16px rgba(0,0,0,0.45)',
            }}
          >
            <div
              className="pointer-events-none absolute -right-32 -top-24 size-72 rounded-full bg-[#EE3F2C]/20 blur-3xl"
              aria-hidden
            />
            <p className="relative text-sm font-medium uppercase tracking-[0.12em] text-white/75">
              Design choices
            </p>
            <ul className="relative mt-6 space-y-4 text-sm text-white/70">
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 bg-[#EE3F2C]" />
                Peak-hour windows (morning / evening) baked into multipliers
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 bg-[#EE3F2C]" />
                Bar charts + timeline so “why” is visible at a glance
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 bg-[#EE3F2C]" />
                WebSocket refresh cadence mimics live ops without claiming real APIs
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-1.5 shrink-0 bg-[#EE3F2C]" />
                Routes tab stays for multimodal trip planning alongside congestion
              </li>
            </ul>
            <Separator className="my-8 bg-white/15" />
            <div className="grid grid-cols-3 gap-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold tabular-nums text-white md:text-3xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/50">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
