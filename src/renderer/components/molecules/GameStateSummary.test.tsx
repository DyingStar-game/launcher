import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import GameStateSummary from './GameStateSummary'

describe('GameStateSummary', () => {
  it('shows where the game stands, without progress by default', () => {
    render(<GameStateSummary heading="Ready to play" detail="Up to date" />)
    expect(screen.getByText('Ready to play')).toBeInTheDocument()
    expect(screen.getByText('Up to date')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('shows the progress while installing', () => {
    render(<GameStateSummary heading="Installing… 43 %" detail="Downloading…" progress={43} />)
    expect(screen.getByRole('progressbar', { name: 'Installing… 43 %' })).toHaveAttribute(
      'aria-valuenow',
      '43'
    )
  })

  it('puts its buttons beside it', () => {
    render(
      <GameStateSummary
        heading="Paused · 35 %"
        detail="1 / 2"
        progress={35}
        actions={<button type="button">Cancel</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })
})
