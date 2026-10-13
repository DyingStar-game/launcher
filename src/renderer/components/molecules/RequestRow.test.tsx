import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import RequestRow from './RequestRow'

const identity = <span>Zed identity</span>

describe('RequestRow', () => {
  it('accepts or declines an incoming request', async () => {
    const onAccept = vi.fn(() => Promise.resolve())
    const onDecline = vi.fn(() => Promise.resolve())
    render(
      <RequestRow
        name="Zed"
        identity={identity}
        kind="incoming"
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
    expect(screen.getByText('Zed identity')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Accept request from Zed' }))
    expect(onAccept).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Decline request from Zed' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('only offers to cancel an outgoing request', async () => {
    const onDecline = vi.fn(() => Promise.resolve())
    render(<RequestRow name="Zed" identity={identity} kind="outgoing" onDecline={onDecline} />)
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Accept request from Zed' })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cancel request to Zed' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('accepts or declines an organisation invitation', async () => {
    const onAccept = vi.fn(() => Promise.resolve())
    const onDecline = vi.fn(() => Promise.resolve())
    render(
      <RequestRow
        name="Nova"
        identity={identity}
        kind="invitation"
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Accept the invitation from Nova' }))
    expect(onAccept).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Decline the invitation from Nova' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('only offers to withdraw an application', async () => {
    const onDecline = vi.fn(() => Promise.resolve())
    render(<RequestRow name="Nova" identity={identity} kind="application" onDecline={onDecline} />)
    expect(screen.getByText('Sent')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw the application to Nova' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('accepts or declines an application received', async () => {
    const onAccept = vi.fn(() => Promise.resolve())
    const onDecline = vi.fn(() => Promise.resolve())
    render(
      <RequestRow
        name="Kira"
        identity={identity}
        kind="received"
        onAccept={onAccept}
        onDecline={onDecline}
      />
    )
    expect(screen.queryByText('Sent')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Accept the application of Kira' }))
    expect(onAccept).toHaveBeenCalledOnce()
    await userEvent.click(screen.getByRole('button', { name: 'Decline the application of Kira' }))
    expect(onDecline).toHaveBeenCalledOnce()
  })

  it('labels its icon buttons with a tooltip', async () => {
    render(
      <RequestRow
        name="Zed"
        identity={identity}
        kind="incoming"
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
