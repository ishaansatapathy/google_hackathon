/**
 * Loads https://www.youtube.com/iframe_api once and resolves when YT.Player is available.
 */
export function loadYouTubeIframeApi(): Promise<NonNullable<Window['YT']>> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('YouTube API requires a browser'))
      return
    }
    if (window.YT?.Player) {
      resolve(window.YT)
      return
    }

    const finish = () => {
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YouTube IFrame API did not expose YT.Player'))
    }

    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      prev?.()
      finish()
    }

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    )
    if (existing) {
      const poll = window.setInterval(() => {
        if (window.YT?.Player) {
          window.clearInterval(poll)
          resolve(window.YT)
        }
      }, 50)
      window.setTimeout(() => window.clearInterval(poll), 15000)
      return
    }

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onerror = () => reject(new Error('Failed to load YouTube iframe_api script'))
    document.head.appendChild(tag)
  })
}
