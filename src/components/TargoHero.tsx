import { TargoLogo } from '@/components/TargoLogo'
import { CLIP_BTN, VIDEO_URL } from '@/lib/targo'

const NAV_LINKS = [
  { href: '#/home/features', label: 'Home' },
  { href: '#/commute', label: 'Commute' },
  { href: '#/jaam', label: 'Jaam' },
  { href: '#/home/features', label: 'Product' },
  { href: '#/home/about', label: 'About' },
  { href: '#/home/contact', label: 'Contact' },
] as const

export function TargoHero() {
  return (
    <section
      id="home"
      className="relative min-h-svh overflow-hidden bg-black text-white"
    >
      <video
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-100"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0 z-1 bg-linear-to-r from-black/80 via-black/45 to-black/15"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-svh flex-col px-8 py-6 md:px-16 md:py-8">
        <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center justify-between gap-4">
            <TargoLogo />
            <a
              href="#/commute/neighbourhood"
              className="inline-flex max-w-52 shrink-0 flex-col items-center gap-0.5 px-3 py-2 text-center text-white sm:hidden"
              style={{ backgroundColor: '#EE3F2C', clipPath: CLIP_BTN }}
            >
              <span className="text-xs font-semibold leading-tight">Friendly neighbourhood</span>
              <span className="text-[9px] font-medium leading-snug text-white/88">
                Congestion, routes & same-route rides
              </span>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 sm:justify-end">
            <nav className="flex flex-wrap items-center gap-5 text-[13px] font-medium tracking-wide text-white/85">
              {NAV_LINKS.map((l) => (
                <a key={`${l.href}-${l.label}`} href={l.href} className="transition hover:text-white">
                  {l.label}
                </a>
              ))}
            </nav>
            <a
              href="#/commute/neighbourhood"
              className="hidden min-w-52 shrink-0 flex-col items-center justify-center gap-1 px-5 py-2.5 text-center text-white sm:inline-flex"
              style={{ backgroundColor: '#EE3F2C', clipPath: CLIP_BTN }}
            >
              <span className="text-[13px] font-semibold leading-tight">Friendly neighbourhood</span>
              <span className="max-w-56 text-[10px] font-medium leading-snug text-white/88">
                Same-route ride requests — pool the trip, skip the solo cab
              </span>
            </a>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-start pt-12 md:pt-16">
          <div className="max-w-208">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/55">
              Metro commute · Live congestion · Smarter departures
            </p>
            <h1
              className="mt-3 text-[40px] font-bold uppercase leading-[1.08] tracking-[-0.04em] text-white md:text-[58px] lg:text-[64px]"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Beat the gridlock before you leave
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/78 md:text-[17px]">
              Simulated corridor sensors, 15 / 30 minute congestion lookahead, and
              one clear action — leave now, wait, or take an alternate — built for
              Mumbai, Delhi NCR, and Bengaluru-style peaks.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <a
                href="#/commute"
                className="inline-flex items-center justify-center bg-[#EE3F2C] px-7 py-3 text-[13px] font-semibold uppercase tracking-wide text-white transition hover:bg-[#EE3F2C]/90"
                style={{ clipPath: CLIP_BTN }}
              >
                Open commute hub
              </a>
              <a
                href="#/home/about"
                className="inline-flex items-center justify-center border border-white/20 bg-white/5 px-7 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/95 transition hover:bg-white/10"
                style={{ clipPath: CLIP_BTN }}
              >
                How it works
              </a>
            </div>
            <p className="mt-6 max-w-lg text-[13px] leading-relaxed text-white/45">
              Hackathon prototype — WebSocket simulates sensor refresh; routing uses
              public OSRM demo. Not official traffic data.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
