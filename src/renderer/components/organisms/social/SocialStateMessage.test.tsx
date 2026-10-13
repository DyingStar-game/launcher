import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { seedSocial } from '../../../test/seedSocial'
import SocialStateMessage from './SocialStateMessage'

describe('SocialStateMessage', () => {
  it('renders nothing when ready', () => {
    seedSocial({})
    const { container } = render(<SocialStateMessage status="ready" />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each([
    ['unavailable', 'Social is not available on this server yet.'],
    ['notSignedIn', 'Sign in to see your friends and organizations.']
  ] as const)('explains the %s state', (status, text) => {
    seedSocial({})
    render(<SocialStateMessage status={status} />)
    expect(screen.getByText(text)).toBeInTheDocument()
  })

  it('shows the error and retries', async () => {
    seedSocial({})
    vi.mocked(window.api.socialLoad).mockResolvedValue({ ok: false, error: 'sanctioned' })
    render(<SocialStateMessage status="error" />)
    expect(await screen.findByText(/Your account is suspended/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(window.api.socialLoad).toHaveBeenCalledTimes(2)
  })

  it('shows a list skeleton while loading, after a short delay', async () => {
    seedSocial({})
    render(<SocialStateMessage status="loading" avatar="square" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })
})
