import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import AppLayout from './AppLayout'

describe('AppLayout', () => {
  it('places the navbar, then the page', () => {
    render(
      <AppLayout navbar={<nav>Nav</nav>}>
        <p>Page</p>
      </AppLayout>
    )
    expect(screen.getByRole('navigation')).toHaveTextContent('Nav')
    expect(screen.getByRole('main')).toHaveTextContent('Page')
  })
})
