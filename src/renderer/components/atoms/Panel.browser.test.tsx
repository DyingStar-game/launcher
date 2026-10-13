import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import Panel from './Panel'

describe('Panel (rendering)', () => {
  it('scrolls with the launcher scrollbar: thin, without arrows', () => {
    render(
      <Panel className="h-40" data-testid="panel">
        <div className="h-96" />
      </Panel>
    )
    const panel = screen.getByTestId('panel')
    const borders = 2
    expect(panel.offsetWidth - panel.clientWidth - borders).toBe(10)
    expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight)
  })
})
