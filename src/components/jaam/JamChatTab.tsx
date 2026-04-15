import { useState } from 'react'
import { Dices, Loader2, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type ChatLine = { id: string; author: string; text: string; isAiBanner?: boolean }

type Props = {
  commuterId: string
  messages: ChatLine[]
  onSend: (text: string) => void
  driverMode: boolean
  iceBanner: string | null
  iceLoading: boolean
  iceError: string | null
  onIcebreaker: () => void
  sentimentKind: 'angry' | 'frustrated' | null
  remainingMinutes: number
}

export function JamChatTab({
  commuterId,
  messages,
  onSend,
  driverMode,
  iceBanner,
  iceLoading,
  iceError,
  onIcebreaker,
  sentimentKind,
  remainingMinutes,
}: Props) {
  const [draft, setDraft] = useState('')

  function submit() {
    const t = draft.trim()
    if (!t || driverMode) return
    onSend(t)
    setDraft('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs text-white/50">You are {commuterId}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={iceLoading}
          className="shrink-0 border-amber-500/40 text-amber-200 hover:bg-amber-500/10"
          onClick={onIcebreaker}
        >
          {iceLoading ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <Dices className="mr-1 size-3.5" />
          )}
          AI Icebreaker 🎲
        </Button>
      </div>
      {iceError ? (
        <p className="mb-2 text-xs text-amber-300/90">{iceError}</p>
      ) : null}

      <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-3">
        {iceBanner ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-950/50 px-3 py-2 text-sm text-amber-50">
            <span className="font-semibold text-amber-200">AI asks:</span> {iceBanner}
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.isAiBanner
                ? 'rounded-lg border border-violet-500/35 bg-violet-950/40 px-3 py-2 text-sm text-violet-100'
                : 'text-sm text-white/85'
            }
          >
            {!m.isAiBanner ? (
              <>
                <span className="font-semibold text-white/70">{m.author}:</span> {m.text}
              </>
            ) : (
              m.text
            )}
          </div>
        ))}
      </div>

      {sentimentKind === 'angry' ? (
        <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-100/95">
          Hey, we&apos;re all in this together 🙏 Keep it chill
        </p>
      ) : null}
      {sentimentKind === 'frustrated' ? (
        <p className="mt-3 rounded-lg border border-sky-500/30 bg-sky-950/40 px-3 py-2 text-xs text-sky-100/95">
          Hang tight! ML says jam clears in ~{Math.max(1, remainingMinutes)} more mins 🚦
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={driverMode ? 'Chat disabled in Driver mode' : 'Type a message…'}
          disabled={driverMode}
          className="border-white/15 bg-black/60 text-white placeholder:text-white/35"
        />
        <Button
          type="button"
          size="icon"
          className="shrink-0 bg-[#EE3F2C] text-white"
          disabled={driverMode || !draft.trim()}
          onClick={submit}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  )
}
