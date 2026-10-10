import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RequestRow from './RequestRow'

const req = { id: 7, playerId: 'p1', name: 'Zed' }

describe('RequestRow', () => {
  it('accepts or declines an incoming request', async () => {
    const onAccept = vi.fn(() => Promise.resolve())
    const onDecline = vi.fn(() => Promise.resolve())
    render(
      <RequestRow
        req={req}
        direction="incoming"
        onOpen={vi.fn()}
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Accept request from Zed' }))
    expect(onAccept).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Decline request from Zed' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('only offers to cancel an outgoing request', async () => {
    const onDecline = vi.fn(() => Promise.resolve())
    render(<RequestRow req={req} direction="outgoing" onOpen={vi.fn()} onDecline={onDecline} />)
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Accept request from Zed' })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel request to Zed' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('opens the sheet from the name', async () => {
    const onOpen = vi.fn()
    render(<RequestRow req={req} direction="outgoing" onOpen={onOpen} onDecline={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open the profile of Zed' }))
    expect(onOpen).toHaveBeenCalledOnce()
  })

  it('labels its icon buttons with a tooltip', async () => {
    render(
      <RequestRow
        req={req}
        direction="incoming"
        onOpen={vi.fn()}
        onAccept={vi.fn(() => Promise.resolve())}
        onDecline={vi.fn(() => Promise.resolve())}
      />
    )
    const accept = screen.getByRole('button', { name: 'Accept request from Zed' })
    expect(accept).not.toHaveAttribute('title')
    await userEvent.hover(accept)
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Accept')
  })
})
