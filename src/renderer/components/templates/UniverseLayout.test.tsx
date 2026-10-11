import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import UniverseLayout from './UniverseLayout'

describe('UniverseLayout', () => {
  it('shows banner, alert, the two panels and the side panel', () => {
    render(
      <UniverseLayout
        banner={<p>Banner</p>}
        alert={<p>Alert</p>}
        panels={[<p key="1">Game</p>, <p key="2">Files</p>]}
        side={<p>Social</p>}
      />
    )
    for (const text of ['Banner', 'Alert', 'Game', 'Files', 'Social']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
  })

  it('omits the alert wrapper without an alert', () => {
    const { container } = render(
      <UniverseLayout panels={[<p key="1">Game</p>, <p key="2">Files</p>]} side={<p>Social</p>} />
    )
    expect(container.querySelector('.pt-3')).toBeNull()
  })
})
