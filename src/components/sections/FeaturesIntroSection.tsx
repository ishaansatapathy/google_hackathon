/** Standalone intro block — kept separate from Product / Services so layouts never overlap. */
export function FeaturesIntroSection() {
  return (
    <section
      id="features-intro"
      aria-labelledby="features-intro-title"
      className="rounded-2xl border border-white/12 bg-black/50 p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] md:p-8"
    >
      <h2 id="features-intro-title" className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
        Overview
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-white/60">
        Live corridor predictor + routes:{' '}
        <a
          href="#/commute"
          className="font-medium text-[#EE3F2C] underline-offset-4 hover:underline"
        >
          Open commute hub
        </a>
        . Friendly neighbourhood rides:{' '}
        <a
          href="#/commute/neighbourhood"
          className="font-medium text-emerald-400/95 underline-offset-4 hover:underline"
        >
          Same-route matching
        </a>
        . Jaam live room:{' '}
        <a href="#/jaam" className="font-medium text-red-400/95 underline-offset-4 hover:underline">
          Pop-up jam community
        </a>
        .
      </p>
    </section>
  )
}
