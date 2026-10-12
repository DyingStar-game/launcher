import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import UniverseLayout from './UniverseLayout'

describe('UniverseLayout', () => {
  it('shows the hero, the side column, the strip and the action bar', () => {
    render(
      <UniverseLayout
        hero={<p>Hero</p>}
        backdrop={<p>Key art</p>}
        side={<p>Social</p>}
        banner={<p>Launcher update</p>}
        actionBar={<p>Action bar</p>}
      />
    )
    for (const text of ['Hero', 'Social', 'Launcher update', 'Action bar']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    // The backdrop is decorative
    expect(screen.getByText('Key art').parentElement).toHaveAttribute('aria-hidden', 'true')
  })
})
