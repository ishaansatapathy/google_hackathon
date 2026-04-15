import { BRAND_RED } from '@/lib/targo'

export function TargoLogo({ className }: { className?: string }) {
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
      <span className="text-lg font-bold tracking-[-0.04em] text-white uppercase">
        targo
      </span>
    </a>
  )
}
