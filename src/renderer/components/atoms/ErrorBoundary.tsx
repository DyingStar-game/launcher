import { Component } from 'react'
import type React from 'react'

export type ErrorBoundaryProps = {
  /** Shown instead of the children once one of them throws while rendering. */
  fallback: (reset: () => void) => React.ReactNode
  children: React.ReactNode
}

type ErrorBoundaryState = { failed: boolean }

/**
 * Keeps a render error inside its zone (ADR 0041): the fallback replaces the children, the rest
 * of the launcher keeps working. A class component, the only kind React lets catch render errors.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[render] A zone failed to render:', error, info.componentStack)
  }

  private reset = (): void => {
    this.setState({ failed: false })
  }

  render(): React.ReactNode {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children
  }
}
