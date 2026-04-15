import { Car, Mic, MicOff, User } from 'lucide-react'

import { Button } from '@/components/ui/button'

type Props = {
  muted: boolean
  onToggleMute: () => void
  driverMode: boolean
  onSetDriverMode: (driver: boolean) => void
  onLeave: () => void
}

export function JamBottomBar({
  muted,
  onToggleMute,
  driverMode,
  onSetDriverMode,
  onLeave,
}: Props) {
  return (
    <footer className="shrink-0 border-t border-white/10 bg-black/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      {driverMode ? (
        <p className="mb-3 rounded-lg border border-amber-500/40 bg-amber-950/50 px-3 py-2 text-center text-xs text-amber-100/95">
          Eyes on road! Chat disabled in Driver mode 🚗
        </p>
      ) : null}
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="border-white/20 text-white"
          onClick={onToggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </Button>

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => onSetDriverMode(false)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              !driverMode ? 'bg-white/15 text-white' : 'text-white/50'
            }`}
          >
            <User className="mr-1 inline size-3.5" />
            Passenger
          </button>
          <button
            type="button"
            onClick={() => onSetDriverMode(true)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              driverMode ? 'bg-amber-600/90 text-white' : 'text-white/50'
            }`}
          >
            <Car className="mr-1 inline size-3.5" />
            Driver
          </button>
        </div>

        <Button type="button" variant="destructive" className="text-xs" onClick={onLeave}>
          Leave Jam
        </Button>
      </div>
    </footer>
  )
}
