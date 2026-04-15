/**
 * Commute hub — top-left mascot (starts below sticky header so it stays visible).
 */
export function HeroMascot() {
  return (
    <div
      className="pointer-events-none fixed left-0 z-40 w-[min(46vw,200px)] sm:w-[min(40vw,240px)]"
      style={{
        top: 'calc(4.75rem + env(safe-area-inset-top, 0px))',
      }}
      aria-hidden
    >
      <div className="mascot-hang flex origin-top justify-start pl-2 sm:pl-3">
        <img
          src={`${import.meta.env.BASE_URL}mascot-neighbourhood.png`}
          alt=""
          width={240}
          height={280}
          className="block h-[min(28vh,160px)] w-auto max-w-full object-contain object-left-top drop-shadow-[0_16px_40px_rgba(0,0,0,0.65)] sm:h-[min(34vh,220px)]"
          draggable={false}
        />
      </div>
    </div>
  )
}
