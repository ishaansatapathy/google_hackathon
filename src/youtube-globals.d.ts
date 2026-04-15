/** Runtime globals set by https://www.youtube.com/iframe_api */
declare global {
  interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady?: () => void
  }
}

export {}
