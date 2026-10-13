import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import AppLayout from './AppLayout'

describe('AppLayout', () => {
  it('places the navbar, the universe bar, then the page', () => {
    render(
      <AppLayout navbar={<header>Nav</header>} universeBar={<nav>Universe</nav>}>
        <p>Page</p>
      </AppLayout>
    )
    expect(screen.getByRole('banner')).toHaveTextContent('Nav')
    expect(screen.getByRole('navigation')).toHaveTextContent('Universe')
    expect(screen.getByRole('main')).toHaveTextContent('Page')
  })
})
