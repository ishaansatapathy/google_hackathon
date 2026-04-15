import { useEffect, useState } from 'react'

import { congestionLabelEn, predictCityCongestionIndex } from '@/lib/emergency/congestionPredictor'
import { cn } from '@/lib/utils'

/** Same dummy congestion clock as Emergency services — commute hub banner. */
export function CongestionLiveStrip() {
  const [score, setScore] = useState(() => predictCityCongestionIndex())

  useEffect(() => {
    const tick = () => setScore(predictCityCongestionIndex())
    tick()
    const id = window.setInterval(tick, 8000)
    return () => window.clearInterval(id)
  }, [])

  const band =
    score >= 67 ? 'danger' : score >= 34 ? 'caution' : 'safe'

  return (
    <div
      className={cn(
        'mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 text-xs md:px-6',
        band === 'danger' && 'bg-red-950/35 text-red-100/95',
        band === 'caution' && 'bg-amber-950/30 text-amber-100/95',
        band === 'safe' && 'bg-emerald-950/25 text-emerald-100/95',
      )}
    >
      <p className="font-mono uppercase tracking-wider text-white/55">Bengaluru congestion · demo model</p>
      <p className="font-mono tabular-nums">
        Index <span className="text-base font-semibold text-white">{score}</span>
        <span className="text-white/50"> /100</span>
        <span className="ml-2 text-white/70">— {congestionLabelEn(score)}</span>
      </p>
    </div>
  )
}
