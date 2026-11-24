import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  fallback: ReactNode
  children: ReactNode
}

interface State {
  hasError: boolean
}

/** Catches WebGL or lazy-chunk runtime failures and renders a safe fallback. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Fallback UI is rendered automatically.
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
