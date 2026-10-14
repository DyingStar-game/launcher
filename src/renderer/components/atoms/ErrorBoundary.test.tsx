import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../test/render'
import ErrorBoundary from './ErrorBoundary'

let broken = true

function Zone(): React.JSX.Element {
  if (broken) throw new Error('unexpected shape')
  return <p>Zone content</p>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    broken = true
    // React and the boundary both log the caught error
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders its children when nothing throws', () => {
    broken = false
    render(
      <ErrorBoundary fallback={() => <p>Fallback</p>}>
        <Zone />
      </ErrorBoundary>
    )
    expect(screen.getByText('Zone content')).toBeInTheDocument()
    expect(screen.queryByText('Fallback')).not.toBeInTheDocument()
  })

  it('replaces only its zone when a child throws, and logs the error', () => {
    render(
      <>
        <p>Top bar</p>
        <ErrorBoundary fallback={() => <p>Fallback</p>}>
          <Zone />
        </ErrorBoundary>
      </>
    )
    expect(screen.getByText('Fallback')).toBeInTheDocument()
    expect(screen.getByText('Top bar')).toBeInTheDocument()
    expect(console.error).toHaveBeenCalledWith(
      '[render] A zone failed to render:',
      expect.any(Error),
      expect.any(String)
    )
  })

  it('renders the children again on reset', () => {
    render(
      <ErrorBoundary fallback={(reset) => <button onClick={reset}>Retry</button>}>
        <Zone />
      </ErrorBoundary>
    )
    broken = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByText('Zone content')).toBeInTheDocument()
  })
})
