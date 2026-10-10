import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSocialStore } from '@stores/social'
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
    act(() =>
      useSocialStore.setState((s) => ({
        data: {
          ...s.data,
          'universe-testing': {
            ...s.data['universe-testing'],
            status: 'error',
            error: 'sanctioned'
          }
        }
      }))
    )
    render(<SocialStateMessage status="error" />)
    expect(screen.getByText(/Your account is suspended/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(window.api.socialLoad).toHaveBeenCalled()
  })

  it('shows a list skeleton while loading, after a short delay', async () => {
    seedSocial({})
    render(<SocialStateMessage status="loading" avatar="square" />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })
})
