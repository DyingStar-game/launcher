import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import UpdateAlert from './UpdateAlert'

describe('UpdateAlert', () => {
  it('shows the new game version', () => {
    render(<UpdateAlert variant="game" currentVersion="0.1.0" latestVersion="0.2.0" />)
    expect(screen.getByText(/0\.2\.0/)).toBeInTheDocument()
  })

  it('can be dismissed', async () => {
    const onDismiss = vi.fn()
    render(<UpdateAlert variant="launcher" latestVersion="1.0.0" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('has no dismiss button without onDismiss', () => {
    render(<UpdateAlert variant="game" latestVersion="0.2.0" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('gives the close button the colour of the alert', () => {
    render(<UpdateAlert variant="game" latestVersion="0.2.0" onDismiss={vi.fn()} />)
    const dismiss = screen.getByRole('button', { name: 'Dismiss alert' })
    // A subtle button sets no text colour of its own: it inherits the alert's
    expect(dismiss).toHaveClass('text-current')
    expect(dismiss).not.toHaveClass('text-muted-foreground')
    expect(dismiss.parentElement).toHaveClass('text-sky-400')
  })
})
