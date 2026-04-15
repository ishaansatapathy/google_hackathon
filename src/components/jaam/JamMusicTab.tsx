import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExternalLink, Loader2, Music, Pause, Play, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { JamPlaylistAi } from '@/components/jaam/jamTypes'
import { JAM_LOCAL_PREVIEWS, previewUrlForIndex, youtubeSearchUrl } from '@/lib/jamAudioSamples'
import { JAM_SEED_YOUTUBE_IDS } from '@/lib/jamYoutubeIds'
import { loadYouTubeIframeApi } from '@/lib/loadYouTubeIframeApi'

type PlayableTrack = {
  previewUrl: string
}

type Song = PlayableTrack & {
  id: string
  name: string
  artist: string
  mood: string
  votes: number
  youtubeVideoId: string | null
}

const SEED: Song[] = [
  {
    id: 's1',
    name: 'Midnight Metro',
    artist: 'The Local Train',
    mood: 'Chill',
    votes: 23,
    previewUrl: JAM_LOCAL_PREVIEWS[0]!,
    youtubeVideoId: JAM_SEED_YOUTUBE_IDS.s1 ?? null,
  },
  {
    id: 's2',
    name: 'Baarishein',
    artist: 'Anuv Jain',
    mood: 'Nostalgic',
    votes: 41,
    previewUrl: JAM_LOCAL_PREVIEWS[1]!,
    youtubeVideoId: JAM_SEED_YOUTUBE_IDS.s2 ?? null,
  },
  {
    id: 's3',
    name: 'Apna Time Aayega',
    artist: 'Gully Boy',
    mood: 'Hype',
    votes: 56,
    previewUrl: JAM_LOCAL_PREVIEWS[2]!,
    youtubeVideoId: JAM_SEED_YOUTUBE_IDS.s3 ?? null,
  },
  {
    id: 's4',
    name: 'Rain & Raga',
    artist: 'Instrumental India',
    mood: 'Chill',
    votes: 18,
    previewUrl: JAM_LOCAL_PREVIEWS[3]!,
    youtubeVideoId: JAM_SEED_YOUTUBE_IDS.s4 ?? null,
  },
  {
    id: 's5',
    name: 'Kun Faya Kun',
    artist: 'Rockstar',
    mood: 'Soul',
    votes: 34,
    previewUrl: JAM_LOCAL_PREVIEWS[4]!,
    youtubeVideoId: JAM_SEED_YOUTUBE_IDS.s5 ?? null,
  },
]

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}cb=${Date.now()}`
}

type Props = {
  playlistLoading: boolean
  playlistError: string | null
  aiPlaylist: JamPlaylistAi | null
  onGeneratePlaylist: () => void
}

export function JamMusicTab({
  playlistLoading,
  playlistError,
  aiPlaylist,
  onGeneratePlaylist,
}: Props) {
  const [songs, setSongs] = useState<Song[]>(SEED)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ytContainerRef = useRef<HTMLDivElement | null>(null)
  const ytPlayerRef = useRef<YT.Player | null>(null)
  const [audioRowId, setAudioRowId] = useState<string | null>(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [ytRowId, setYtRowId] = useState<string | null>(null)
  const [ytPlaying, setYtPlaying] = useState(false)
  const [playError, setPlayError] = useState<string | null>(null)
  const [ytLoading, setYtLoading] = useState(false)

  const hasYouTubeIds = useMemo(() => songs.some((s) => s.youtubeVideoId), [songs])

  const bump = useCallback((id: string) => {
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, votes: s.votes + 1 } : s)),
    )
  }, [])

  const pauseHtml5 = useCallback(() => {
    const el = audioRef.current
    if (el && !el.paused) el.pause()
    setAudioPlaying(false)
  }, [])

  const pauseYouTube = useCallback(() => {
    const p = ytPlayerRef.current
    if (!p?.getPlayerState) return
    try {
      const st = p.getPlayerState()
      if (st === window.YT.PlayerState.PLAYING) p.pauseVideo()
      setYtPlaying(false)
    } catch {
      /* ignore */
    }
  }, [])

  const handleYtStateChange = useCallback((e: YT.OnStateChangeEvent) => {
    const YTg = window.YT
    if (!YTg) return
    if (e.data === YTg.PlayerState.CUED) e.target.playVideo()
    if (e.data === YTg.PlayerState.PLAYING) setYtPlaying(true)
    if (e.data === YTg.PlayerState.PAUSED || e.data === YTg.PlayerState.ENDED) setYtPlaying(false)
  }, [])

  const playYouTubeTrack = useCallback(
    async (rowId: string, videoId: string, bumpOnStart: boolean) => {
      setPlayError(null)
      pauseHtml5()
      setAudioRowId(null)

      const existing = ytPlayerRef.current
      if (existing && ytRowId === rowId) {
        try {
          const st = existing.getPlayerState()
          if (st === window.YT.PlayerState.PLAYING) {
            existing.pauseVideo()
            return
          }
          existing.playVideo()
          return
        } catch {
          /* fall through */
        }
      }

      if (!ytContainerRef.current) {
        setPlayError('YouTube player container not ready.')
        return
      }

      setYtLoading(true)
      try {
        const ytApi = await loadYouTubeIframeApi()

        if (!ytPlayerRef.current) {
          const switched = ytRowId !== rowId
          const player = new ytApi.Player(ytContainerRef.current, {
            videoId,
            height: '180',
            width: '100%',
            playerVars: {
              autoplay: 1,
              playsinline: 1,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onReady: (ev: YT.PlayerEvent) => {
                ev.target.playVideo()
                if (switched && bumpOnStart) bump(rowId)
                setYtRowId(rowId)
                setYtLoading(false)
              },
              onError: () => {
                setPlayError('YouTube could not play this video (blocked or invalid ID).')
                setYtLoading(false)
              },
              onStateChange: handleYtStateChange,
            },
          })
          ytPlayerRef.current = player
          return
        }

        const ready = ytPlayerRef.current
        if (!ready) {
          setYtLoading(false)
          return
        }

        const switched = ytRowId !== rowId
        if (switched && bumpOnStart) bump(rowId)
        ready.loadVideoById(videoId)
        ready.playVideo()
        setYtRowId(rowId)
        setYtLoading(false)
      } catch {
        setPlayError('YouTube IFrame API failed to load.')
        setYtLoading(false)
      }
    },
    [bump, handleYtStateChange, pauseHtml5, ytRowId],
  )

  /** Main row tap: always your server MP3 (`public/jaam/...`), never YouTube. */
  const playLocalOrToggle = useCallback(
    async (rowId: string, track: PlayableTrack, bumpOnStart: boolean) => {
      setPlayError(null)
      pauseYouTube()
      setYtRowId(null)
      setYtPlaying(false)

      const el = audioRef.current
      if (!el) return

      if (audioRowId === rowId) {
        if (audioPlaying) {
          el.pause()
          setAudioPlaying(false)
        } else {
          try {
            await el.play()
            setAudioPlaying(true)
          } catch {
            setPlayError('Preview could not play — check network / CORS')
          }
        }
        return
      }

      el.pause()
      el.src = withCacheBust(track.previewUrl)
      el.load()
      try {
        await el.play()
        setAudioRowId(rowId)
        setAudioPlaying(true)
        if (bumpOnStart) bump(rowId)
      } catch {
        setPlayError('Preview could not play — try again')
        setAudioRowId(null)
        setAudioPlaying(false)
      }
    },
    [audioPlaying, audioRowId, bump, pauseYouTube],
  )

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onEnded = () => {
      setAudioPlaying(false)
    }
    const onError = () => {
      setPlayError('Audio file missing or unreadable — check public/jaam/ for this song.')
      setAudioPlaying(false)
      setAudioRowId(null)
    }
    el.addEventListener('ended', onEnded)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('ended', onEnded)
      el.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    return () => {
      try {
        ytPlayerRef.current?.destroy()
      } catch {
        /* ignore */
      }
      ytPlayerRef.current = null
    }
  }, [])

  return (
    <div className="space-y-4">
      <audio ref={audioRef} preload="none" className="hidden" />

      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Music className="size-5 text-[#EE3F2C]" />
          Jam Playlist
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={playlistLoading}
          className="border-violet-500/40 text-violet-200 hover:bg-violet-500/15"
          onClick={onGeneratePlaylist}
        >
          {playlistLoading ? (
            <Loader2 className="mr-1 size-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1 size-3.5" />
          )}
          AI Playlist for this Jam 🎵
        </Button>
      </div>
      {playlistError ? (
        <p className="text-xs text-amber-300/90">{playlistError}</p>
      ) : null}
      {playError ? (
        <p className="text-xs text-rose-300/90" role="alert">
          {playError}
        </p>
      ) : null}
      {ytLoading ? (
        <p className="flex items-center gap-2 text-xs text-violet-200/90">
          <Loader2 className="size-3.5 animate-spin" />
          Loading YouTube player…
        </p>
      ) : null}
      <p className="text-[11px] text-white/45">
        <strong className="text-white/65">Play</strong> uses files on your app server:{' '}
        <code className="rounded bg-white/10 px-1 text-[10px]">public/jaam/</code> (e.g.{' '}
        <code className="rounded bg-white/10 px-1 text-[10px]">baarishein.mp3</code> for Baarishein). Replace those
        MP3s with the real tracks you are allowed to use.{' '}
        <span className="text-white/55">YT</span> is optional — streams from YouTube only when you set an ID in{' '}
        <code className="rounded bg-white/10 px-1 text-[10px]">jamYoutubeIds.ts</code>.
      </p>

      {hasYouTubeIds ? (
        <div className="overflow-hidden rounded-xl border border-white/15 bg-black/50">
          <div ref={ytContainerRef} className="aspect-video w-full min-h-[180px] bg-black" />
        </div>
      ) : null}

      {aiPlaylist ? (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/25 p-4">
          <p className="text-sm leading-relaxed text-white/80">{aiPlaylist.mood_description}</p>
          <ul className="mt-4 space-y-3">
            {aiPlaylist.songs.map((song, i) => {
              const aid = `ai-${i}-${song.name}`
              const src = previewUrlForIndex(i)
              const active = audioRowId === aid && audioPlaying
              const yt = youtubeSearchUrl(song.name, song.artist)
              return (
                <li key={aid}>
                  <div className="relative rounded-lg border border-white/10 bg-black/40 transition hover:border-violet-500/40">
                    <a
                      href={yt}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-12 top-2 z-10 inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-black/50 px-2 py-1 text-[10px] font-medium text-violet-200 hover:bg-violet-500/20"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Search ${song.name} on YouTube`}
                    >
                      <ExternalLink className="size-3" />
                      YT
                    </a>
                    <button
                      type="button"
                      onClick={() => void playLocalOrToggle(aid, { previewUrl: src }, true)}
                      className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">
                          {song.name}{' '}
                          <span className="ml-1 rounded bg-violet-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            AI Pick ✨
                          </span>
                        </p>
                        <p className="text-xs text-white/50">{song.artist}</p>
                        <span className="text-[11px] text-violet-300/90">{song.mood_tag}</span>
                      </div>
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                            : 'border-white/20 bg-white/5 text-white/80'
                        }`}
                        aria-hidden
                      >
                        {active ? <Pause className="size-4" /> : <Play className="size-4 pl-0.5" />}
                      </span>
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-3">
        {songs.map((s) => {
          const localActive = audioRowId === s.id && audioPlaying
          const ytSearchHref = youtubeSearchUrl(s.name, s.artist)
          return (
            <li key={s.id}>
              <div
                className={`relative rounded-xl border transition ${
                  localActive
                    ? 'border-[#EE3F2C]/60 bg-[#EE3F2C]/10'
                    : 'border-white/10 bg-black/35 hover:border-[#EE3F2C]/40'
                }`}
              >
                {s.youtubeVideoId ? (
                  <button
                    type="button"
                    className="absolute right-14 top-3 z-10 inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-black/50 px-2 py-1 text-[10px] font-medium text-rose-200/95 hover:bg-[#EE3F2C]/20"
                    onClick={(e) => {
                      e.stopPropagation()
                      void playYouTubeTrack(s.id, s.youtubeVideoId!, false)
                    }}
                    aria-label={`Play ${s.name} via YouTube embed`}
                  >
                    <ExternalLink className="size-3" />
                    YT
                  </button>
                ) : (
                  <a
                    href={ytSearchHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute right-14 top-3 z-10 inline-flex items-center gap-0.5 rounded-full border border-white/15 bg-black/50 px-2 py-1 text-[10px] font-medium text-rose-200/95 hover:bg-[#EE3F2C]/20"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Search ${s.name} on YouTube`}
                  >
                    <ExternalLink className="size-3" />
                    YT
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => void playLocalOrToggle(s.id, s, true)}
                  className="flex w-full items-center justify-between gap-3 p-3 pr-14 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-white/50">{s.artist}</p>
                    <span className="mt-1 inline-block rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60">
                      {s.mood}
                    </span>
                    <p className="mt-0.5 truncate font-mono text-[10px] text-white/35" title={s.previewUrl}>
                      {s.previewUrl}
                    </p>
                    {ytRowId === s.id && ytPlaying ? (
                      <p className="mt-1 text-[10px] text-violet-300/90">YouTube playing (tap YT to pause)</p>
                    ) : null}
                    <p className="mt-1 text-xs text-emerald-300/90">{s.votes} people vibing</p>
                  </div>
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full border ${
                      localActive
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100'
                        : 'border-white/20 bg-white/8 text-white'
                    }`}
                    aria-hidden
                  >
                    {localActive ? <Pause className="size-5" /> : <Play className="size-5 pl-0.5" />}
                  </span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
