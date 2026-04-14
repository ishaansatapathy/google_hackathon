import { Phone } from 'lucide-react'

const BRAND_RED = '#EE3F2C'
const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260227_042027_c4b2f2ea-1c7c-4d6e-9e3d-81a78063703f.mp4'

/** 11px diagonal chamfers on top-right and bottom-left */
const clipBtn =
  'polygon(0 0,calc(100% - 11px) 0,100% 11px,100% 100%,11px 100%,0 calc(100% - 11px))'

function TargoLogo({ className }: { className?: string }) {
  return (
    <a href="#home" className={`flex items-center gap-3 ${className ?? ''}`}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <path
          d="M8 28 L20 8 L32 28 L26 28 L20 17 L14 28 Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M12 30 L20 18 L28 30"
          stroke={BRAND_RED}
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
      <span
        className="text-lg font-bold tracking-[-0.04em] text-white uppercase"
        style={{ fontFamily: "'Rubik', sans-serif" }}
      >
        targo
      </span>
    </a>
  )
}

export function TargoHero() {
  return (
    <section
      id="home"
      className="relative min-h-svh overflow-hidden bg-black text-white"
      style={{ fontFamily: "'Rubik', sans-serif" }}
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

      <div className="relative z-10 flex min-h-svh flex-col px-8 py-6 md:px-16 md:py-8">
        <header className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center justify-between gap-4">
            <TargoLogo />
            <a
              href="#contact"
              className="inline-block shrink-0 px-4 py-2 text-xs font-semibold text-white sm:hidden"
              style={{
                backgroundColor: BRAND_RED,
                clipPath: clipBtn,
              }}
            >
              Contact Us
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 sm:justify-end">
            <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/90">
              <a href="#home" className="transition hover:text-white">
                Home
              </a>
              <a href="#about" className="transition hover:text-white">
                About
              </a>
              <a href="#contact" className="transition hover:text-white">
                Contact Us
              </a>
            </nav>
            <a
              href="#contact"
              className="hidden shrink-0 px-5 py-2.5 text-sm font-semibold text-white sm:inline-block"
              style={{
                backgroundColor: BRAND_RED,
                clipPath: clipBtn,
              }}
            >
              Contact Us
            </a>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col pt-10 md:pt-14">
          <div id="about" className="max-w-[52rem]">
            <h1
              className="text-[42px] font-bold uppercase leading-[1.05] tracking-[-0.04em] text-white md:text-[64px]"
              style={{ textWrap: 'balance' }}
            >
              Swift and Simple Transport
            </h1>
            <div className="mt-8">
              <button
                type="button"
                className="px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-white"
                style={{
                  backgroundColor: BRAND_RED,
                  clipPath: clipBtn,
                }}
              >
                Get Started
              </button>
            </div>
          </div>

          <div id="contact" className="mt-auto scroll-mt-8 pt-16 md:pt-20">
            <div
              className="max-w-md rounded-sm border border-white/[0.12] p-6 md:p-7"
              style={{
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 42%, transparent 48%, rgba(255,255,255,0.06) 100%)',
                boxShadow:
                  'inset 0 1px 0 0 rgba(255,255,255,0.18), inset 0 -2px 12px rgba(0,0,0,0.35)',
              }}
            >
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-white/80">
                Book a Free Consultation
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Plan your next move with our logistics specialists — tailored
                routes, clear timelines.
              </p>
              <button
                type="button"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-black"
                style={{
                  backgroundColor: '#ffffff',
                  clipPath: clipBtn,
                }}
              >
                <Phone className="h-4 w-4 shrink-0" strokeWidth={2} />
                Book a Call
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
