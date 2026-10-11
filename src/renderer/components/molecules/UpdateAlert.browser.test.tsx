import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import UpdateAlert from './UpdateAlert'

describe('UpdateAlert (rendering)', () => {
  it('draws the close button in the colour of the alert', () => {
    render(<UpdateAlert variant="game" latestVersion="0.2.0" onDismiss={vi.fn()} />)
    const dismiss = screen.getByRole('button', { name: 'Dismiss alert' })
    expect(getComputedStyle(dismiss).color).toBe(getComputedStyle(dismiss.parentElement!).color)
  })
})
