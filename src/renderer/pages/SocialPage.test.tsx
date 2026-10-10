import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAccountStore } from '@stores/account'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../test/seedSocial'
import SocialPage from './SocialPage'

describe('SocialPage', () => {
  it('comes back with Back to the tab and search it was left on', async () => {
    seedSocial({})
    act(() => useNavigationStore.getState().navigate('social'))
    act(() =>
      useAccountStore.setState((s) => ({
        data: { ...s.data, 'universe-testing': { status: 'connected', username: 'me' } }
      }))
    )
    vi.mocked(window.api.socialSearchPlayers).mockResolvedValue({
      ok: true,
      data: [{ id: 'p1', name: 'Kira' }]
    })

    const { unmount } = render(<SocialPage />)
    await userEvent.click(screen.getByRole('tab', { name: 'Find players' }))
    await userEvent.type(screen.getByRole('textbox'), 'kir')
    await userEvent.click(await screen.findByRole('button', { name: 'Open the profile of Kira' }))
    expect(useNavigationStore.getState().currentView).toBe('player')
    unmount()

    act(() => useNavigationStore.getState().back())
    render(<SocialPage />)
    expect(screen.getByRole('heading', { level: 1, name: 'Find players' })).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveValue('kir')
    expect(await screen.findByText('Kira')).toBeInTheDocument()
  })

  it('labels the content as the panel of the selected tab', () => {
    seedSocial({})
    act(() => useNavigationStore.getState().navigate('social'))
    render(<SocialPage />)
    const tab = screen.getByRole('tab', { name: 'Friends' })
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tab.id)
  })
})
