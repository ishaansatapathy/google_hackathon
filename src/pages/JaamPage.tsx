import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { JamBottomBar } from '@/components/jaam/JamBottomBar'
import { JamChatTab, type ChatLine } from '@/components/jaam/JamChatTab'
import { JamMusicTab } from '@/components/jaam/JamMusicTab'
import { JamPollTab } from '@/components/jaam/JamPollTab'
import { JamStatusHeader } from '@/components/jaam/JamStatusHeader'
import { JAM_SNAPSHOT, type JamHeaderAi, type JamPlaylistAi, type JamPollAi } from '@/components/jaam/jamTypes'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { callClaudeJson, callClaudeText } from '@/lib/jamClaude'
import { setHash } from '@/lib/hashRoute'
import { checkSentiment, predictJamDuration } from '@/utils/jamML'

const INITIAL_CHAT: ChatLine[] = [
  { id: 'm1', author: 'Commuter #88', text: 'bhai kitna aur time lagega 😭' },
  { id: 'm2', author: 'Commuter #203', text: 'WEH pe accident hua hai aage' },
  { id: 'm3', author: 'Commuter #55', text: 'koi achi song suggest karo yaar' },
  { id: 'm4', author: 'Commuter #301', text: 'Radio pe bol rahe barish slow traffic' },
  { id: 'm5', author: 'Commuter #12', text: 'Same jam since Andheri 😤' },
]

function randomCommuterId(): string {
  return `Commuter #${400 + Math.floor(Math.random() * 200)}`
}

export function JaamPage() {
  const [tab, setTab] = useState('chat')

  const mlMinutes = useMemo(
    () => predictJamDuration(9, 1, JAM_SNAPSHOT.weather, JAM_SNAPSHOT.location),
    [],
  )
  const totalSeconds = mlMinutes * 60
  const [remainingSeconds, setRemainingSeconds] = useState(() => totalSeconds)

  const [jamAi, setJamAi] = useState<JamHeaderAi | null>(null)
  const [headerLoading, setHeaderLoading] = useState(true)
  const [headerError, setHeaderError] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatLine[]>(INITIAL_CHAT)
  const [commuterId] = useState(() => randomCommuterId())
  const [sentimentKind, setSentimentKind] = useState<'angry' | 'frustrated' | null>(null)

  const [iceBanner, setIceBanner] = useState<string | null>(null)
  const [iceLoading, setIceLoading] = useState(false)
  const [iceError, setIceError] = useState<string | null>(null)

  const [playlistLoading, setPlaylistLoading] = useState(false)
  const [playlistError, setPlaylistError] = useState<string | null>(null)
  const [aiPlaylist, setAiPlaylist] = useState<JamPlaylistAi | null>(null)

  const [pollLoading, setPollLoading] = useState(false)
  const [pollError, setPollError] = useState<string | null>(null)
  const [aiPoll, setAiPoll] = useState<JamPollAi | null>(null)
  const [aiVotes, setAiVotes] = useState<[number, number, number]>([0, 0, 0])

  const [muted, setMuted] = useState(false)
  const [driverMode, setDriverMode] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => {
      setRemainingSeconds((s) => (s <= 0 ? 0 : s - 1))
    }, 1000)
    return () => window.clearInterval(t)
  }, [])

  useEffect(() => {
    let cancelled = false
    const prompt = `You are a fun urban commute assistant. A traffic jam has been detected with these details:
Location: ${JAM_SNAPSHOT.location}
Time: ${JAM_SNAPSHOT.timeLabel}
Weather: ${JAM_SNAPSHOT.weather}
Vehicles stuck: ${JAM_SNAPSHOT.vehicles}
Estimated duration: ${JAM_SNAPSHOT.narrativeMinutes} minutes

Return ONLY a JSON object with no markdown, no explanation:
{
  "jam_name": "a fun 2-3 word name for this jam",
  "vibe_tag": "3-4 word current vibe description",
  "personality_line": "one witty sentence describing this jam's personality"
}`

    async function run() {
      setHeaderLoading(true)
      setHeaderError(null)
      try {
        const data = await callClaudeJson<JamHeaderAi>(prompt)
        if (!cancelled) setJamAi(data)
      } catch {
        if (!cancelled) {
          setHeaderError('AI is thinking too hard 😅 Try again')
          setJamAi({
            jam_name: 'Monsoon Crawl',
            vibe_tag: 'stuck but vibing',
            personality_line: 'This jam has main-character energy and zero lane discipline.',
          })
        }
      } finally {
        if (!cancelled) setHeaderLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const onSendMessage = useCallback((text: string) => {
    const id = `u-${Date.now()}`
    setMessages((m) => [...m, { id, author: commuterId, text }])
    const s = checkSentiment(text)
    setSentimentKind(s === 'neutral' ? null : s)
  }, [commuterId])

  const onIcebreaker = useCallback(async () => {
    setIceLoading(true)
    setIceError(null)
    try {
      const q = await callClaudeText(
        `Generate one short fun engaging question or hot take for commuters stuck in a Mumbai traffic jam on a rainy Monday morning. 
Keep it relatable, funny, and urban. Max 15 words. Return only the question, nothing else.`,
      )
      setIceBanner(q.trim())
    } catch {
      setIceError('AI is thinking too hard 😅 Try again')
    } finally {
      setIceLoading(false)
    }
  }, [])

  const onGeneratePlaylist = useCallback(async () => {
    setPlaylistLoading(true)
    setPlaylistError(null)
    try {
      const prompt = `A group of commuters are stuck in heavy Mumbai traffic. Context:
Time: Monday 9 AM
Weather: Rainy
Jam duration: ${mlMinutes} mins
Current vibe: Frustrated but social

Return ONLY a JSON object with no markdown:
{
  "mood_description": "2 sentence description of the perfect playlist mood for this jam",
  "songs": [
    { "name": "song name", "artist": "artist name", "mood_tag": "one word mood" },
    { "name": "song name", "artist": "artist name", "mood_tag": "one word mood" },
    { "name": "song name", "artist": "artist name", "mood_tag": "one word mood" }
  ]
}`
      const data = await callClaudeJson<JamPlaylistAi>(prompt)
      setAiPlaylist(data)
    } catch {
      setPlaylistError('AI is thinking too hard 😅 Try again')
    } finally {
      setPlaylistLoading(false)
    }
  }, [mlMinutes])

  const onGeneratePoll = useCallback(async () => {
    setPollLoading(true)
    setPollError(null)
    try {
      const prompt = `Generate a fun, relatable poll question for Mumbai commuters stuck in a traffic jam.
Make it humorous but relevant to urban commuting.

Return ONLY a JSON object with no markdown:
{
  "question": "the poll question",
  "options": ["option 1", "option 2", "option 3"]
}`
      const data = await callClaudeJson<JamPollAi>(prompt)
      if (data.options?.length === 3) {
        setAiPoll(data)
        setAiVotes([0, 0, 0])
      }
    } catch {
      setPollError('AI is thinking too hard 😅 Try again')
    } finally {
      setPollLoading(false)
    }
  }, [])

  const onVoteAi = useCallback((index: 0 | 1 | 2) => {
    setAiVotes((v) => {
      const n = [...v] as [number, number, number]
      n[index] += 1
      return n
    })
  }, [])

  const remainingMinutes = Math.max(0, Math.ceil(remainingSeconds / 60))

  return (
    <div className="flex min-h-dvh flex-col bg-black text-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-white/80"
          onClick={() => setHash({ page: 'home', tab: 'features' })}
        >
          <ArrowLeft className="mr-1 size-4" />
          Home
        </Button>
        <span className="text-xs font-semibold uppercase tracking-wider text-red-400/90">Jaam</span>
      </div>

      <JamStatusHeader
        jamAi={jamAi}
        headerLoading={headerLoading}
        headerError={headerError}
        vehicles={JAM_SNAPSHOT.vehicles}
        mlMinutes={mlMinutes}
        remainingSeconds={remainingSeconds}
        totalSeconds={totalSeconds}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pb-2 pt-2">
        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-3">
          <TabsList className="grid w-full shrink-0 grid-cols-3 bg-white/8 p-1">
            <TabsTrigger value="chat" className="text-xs sm:text-sm">
              Chat
            </TabsTrigger>
            <TabsTrigger value="music" className="text-xs sm:text-sm">
              Music
            </TabsTrigger>
            <TabsTrigger value="poll" className="text-xs sm:text-sm">
              Poll
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="mt-0 min-h-0 flex-1 overflow-hidden outline-none data-[state=inactive]:hidden">
            <JamChatTab
              commuterId={commuterId}
              messages={messages}
              onSend={onSendMessage}
              driverMode={driverMode}
              iceBanner={iceBanner}
              iceLoading={iceLoading}
              iceError={iceError}
              onIcebreaker={onIcebreaker}
              sentimentKind={sentimentKind}
              remainingMinutes={remainingMinutes}
            />
          </TabsContent>

          <TabsContent value="music" className="mt-0 min-h-0 flex-1 overflow-y-auto outline-none data-[state=inactive]:hidden">
            <JamMusicTab
              playlistLoading={playlistLoading}
              playlistError={playlistError}
              aiPlaylist={aiPlaylist}
              onGeneratePlaylist={onGeneratePlaylist}
            />
          </TabsContent>

          <TabsContent value="poll" className="mt-0 min-h-0 flex-1 overflow-y-auto outline-none data-[state=inactive]:hidden">
            <JamPollTab
              pollLoading={pollLoading}
              pollError={pollError}
              aiPoll={aiPoll}
              aiVotes={aiVotes}
              onGeneratePoll={onGeneratePoll}
              onVoteAi={onVoteAi}
            />
          </TabsContent>
        </Tabs>
      </div>

      <JamBottomBar
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
        driverMode={driverMode}
        onSetDriverMode={setDriverMode}
        onLeave={() => setLeaveOpen(true)}
      />

      {leaveOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-labelledby="leave-jam-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#111] p-5 shadow-2xl">
            <h2 id="leave-jam-title" className="text-lg font-semibold text-white">
              Leave this jam?
            </h2>
            <p className="mt-2 text-sm text-white/65">
              Are you sure? The jam community will miss you 👋
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setLeaveOpen(false)}>
                Stay
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setLeaveOpen(false)
                  setHash({ page: 'home', tab: 'features' })
                }}
              >
                Leave
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
