import { Brain, Loader2 } from 'lucide-react'

import type { JamHeaderAi } from '@/components/jaam/jamTypes'

type Props = {
  jamAi: JamHeaderAi | null
  headerLoading: boolean
  headerError: string | null
  vehicles: number
  mlMinutes: number
  remainingSeconds: number
  totalSeconds: number
}

export function JamStatusHeader({
  jamAi,
  headerLoading,
  headerError,
  vehicles,
  mlMinutes,
  remainingSeconds,
  totalSeconds,
}: Props) {
  const progress = totalSeconds > 0 ? Math.min(100, (remainingSeconds / totalSeconds) * 100) : 0
  const remMin = Math.max(0, Math.ceil(remainingSeconds / 60))

  return (
    <header className="shrink-0 border-b border-white/10 bg-[#0c0c0c] px-4 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-linear-to-br from-red-950/50 to-black/80 p-4 shadow-[0_0_40px_rgba(239,68,68,0.12)]">
        <div className="flex items-center gap-2">
          <span className="relative flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400/80 opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-red-500" />
          </span>
          <span className="text-sm font-semibold tracking-wide text-red-100">
            You&apos;re in a Jam
          </span>
        </div>

        {headerLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-white/55">
            <Loader2 className="size-4 animate-spin text-amber-400" />
            Naming this jam…
          </div>
        ) : headerError ? (
          <p className="mt-3 text-xs text-amber-200/90">{headerError}</p>
        ) : jamAi ? (
          <div className="mt-4 space-y-2">
            <h1 className="text-xl font-bold text-white">{jamAi.jam_name}</h1>
            <p className="text-sm font-medium text-amber-200/95">{jamAi.vibe_tag}</p>
            <p className="text-sm leading-relaxed text-white/75">{jamAi.personality_line}</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/60">
          <span>
            <strong className="text-white/90">{vehicles}</strong> vehicles stuck
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-violet-950/40 px-2 py-0.5 text-violet-200/95">
            <Brain className="size-3.5 shrink-0" />
            ML Estimate: ~{mlMinutes} mins to clear
          </span>
        </div>

        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-500 via-red-500 to-red-600 transition-[width] duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] text-white/45">
            Clearing in ~{remMin} min · This group dissolves when traffic clears
          </p>
        </div>
      </div>
    </header>
  )
}
