/**
 * Audio files live in public/jaam/ — filenames match each playlist row.
 * Swap any file for your own licensed MP3 to hear that exact song in-app.
 */
export const JAM_LOCAL_PREVIEWS = [
  '/jaam/midnight-metro.mp3',
  '/jaam/baarishein.mp3',
  '/jaam/apna-time-aayega.mp3',
  '/jaam/rain-raga.mp3',
  '/jaam/kun-faya-kun.mp3',
] as const

export function previewUrlForIndex(i: number): string {
  return JAM_LOCAL_PREVIEWS[i % JAM_LOCAL_PREVIEWS.length]!
}

export function youtubeSearchUrl(name: string, artist: string): string {
  const q = `${name} ${artist}`.trim()
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
}
