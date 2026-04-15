import { useState } from 'react'
import { Loader2, Sparkles, Vote } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { JamPollAi } from '@/components/jaam/jamTypes'

type Props = {
  pollLoading: boolean
  pollError: string | null
  aiPoll: JamPollAi | null
  aiVotes: [number, number, number]
  onGeneratePoll: () => void
  onVoteAi: (index: 0 | 1 | 2) => void
}

export function JamPollTab({
  pollLoading,
  pollError,
  aiPoll,
  aiVotes,
  onGeneratePoll,
  onVoteAi,
}: Props) {
  const [votes, setVotes] = useState([42, 28, 19])
  const [totalClicks, setTotalClicks] = useState(89)

  const hardcodedOptions = [
    'WEH straight ahead',
    'Divert via SV Road',
    'Waiting it out',
  ] as const

  function voteHard(i: 0 | 1 | 2) {
    setVotes((v) => {
      const n = [...v] as [number, number, number]
      n[i] += 1
      return n
    })
    setTotalClicks((t) => t + 1)
  }

  const sum = votes.reduce((a, b) => a + b, 0)
  const aiSum = Math.max(1, aiVotes.reduce((a, b) => a + b, 0))

  return (
    <div className="space-y-6">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Vote className="size-5 text-[#EE3F2C]" />
        Jam Poll — live community vote
      </h3>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="font-medium text-white">Which route are you taking out of this jam?</p>
        <p className="mt-1 text-xs text-white/45">{totalClicks} voters in this room</p>
        <ul className="mt-4 space-y-3">
          {hardcodedOptions.map((label, i) => {
            const pct = sum ? (votes[i]! / sum) * 100 : 0
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={() => voteHard(i as 0 | 1 | 2)}
                  className="w-full text-left"
                >
                  <div className="mb-1 flex justify-between text-xs text-white/70">
                    <span>
                      {String.fromCharCode(65 + i)}. {label}
                    </span>
                    <span>{votes[i]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-[#EE3F2C] to-amber-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          disabled={pollLoading}
          className="w-full border-emerald-500/40 text-emerald-200 hover:bg-emerald-500/10"
          onClick={onGeneratePoll}
        >
          {pollLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 size-4" />
          )}
          Generate AI Poll 🗳️
        </Button>
        {pollError ? (
          <p className="mt-2 text-xs text-amber-300/90">{pollError}</p>
        ) : null}
      </div>

      {aiPoll ? (
        <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
            AI Generated Poll ✨
          </p>
          <p className="mt-2 font-medium text-white">{aiPoll.question}</p>
          <ul className="mt-4 space-y-3">
            {aiPoll.options.map((label, i) => {
              const pct = (aiVotes[i]! / aiSum) * 100
              return (
                <li key={`${label}-${i}`}>
                  <button
                    type="button"
                    onClick={() => onVoteAi(i as 0 | 1 | 2)}
                    className="w-full text-left"
                  >
                    <div className="mb-1 flex justify-between text-xs text-white/70">
                      <span>
                        {String.fromCharCode(65 + i)}. {label}
                      </span>
                      <span>{aiVotes[i]}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-emerald-600 to-teal-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
