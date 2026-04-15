export type JamHeaderAi = {
  jam_name: string
  vibe_tag: string
  personality_line: string
}

export type JamPlaylistAi = {
  mood_description: string
  songs: Array<{ name: string; artist: string; mood_tag: string }>
}

export type JamPollAi = {
  question: string
  options: [string, string, string]
}

export const JAM_SNAPSHOT = {
  location: 'Western Express Highway, Mumbai',
  timeLabel: 'Monday 9:05 AM',
  weather: 'Rainy',
  vehicles: 340,
  /** Shown alongside ML; Claude prompt context */
  narrativeMinutes: 24,
} as const
