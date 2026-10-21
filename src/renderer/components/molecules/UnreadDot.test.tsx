import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import UnreadDot from './UnreadDot'

describe('UnreadDot', () => {
  it('reads as "New" by default', () => {
    render(
      <button type="button">
        14/10 · 17:30 <UnreadDot />
      </button>
    )
    expect(screen.getByRole('button', { name: /14\/10 · 17:30.*New/ })).toBeInTheDocument()
  })

  it('reads another word when given one', () => {
    render(
      <button type="button">
        v0.1.0 <UnreadDot label="Unread" />
      </button>
    )
    expect(screen.getByRole('button', { name: /v0\.1\.0.*Unread/ })).toBeInTheDocument()
  })
})
