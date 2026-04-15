import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }

type State = { error: Error | null }

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-dvh bg-neutral-950 p-6 text-white">
          <h1 className="text-lg font-semibold">Something broke while loading</h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Refresh the page. If this keeps happening, open the browser console (F12)
            and share the error.
          </p>
          <pre className="mt-4 overflow-auto rounded-lg bg-black/50 p-4 text-xs text-red-200">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
