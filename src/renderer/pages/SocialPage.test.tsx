import { describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '../test/render'
import userEvent from '@testing-library/user-event'
import { useAccountStore } from '@stores/account'
import { useNavigationStore } from '@stores/navigation'
import { organisationRequest, seedSocial } from '../test/seedSocial'
import SocialPage from './SocialPage'

describe('SocialPage', () => {
  it('comes back with Back to the section, sub-tab and search it was left on', async () => {
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
    await userEvent.click(screen.getByRole('tab', { name: 'Find a player' }))
    await userEvent.type(await screen.findByRole('textbox'), 'kir')
    await userEvent.click(await screen.findByRole('button', { name: 'Open the profile of Kira' }))
    expect(useNavigationStore.getState().currentView).toBe('player')
    unmount()

    act(() => useNavigationStore.getState().back())
    render(<SocialPage />)
    expect(screen.getByRole('tab', { name: 'Find a player' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    expect(await screen.findByRole('textbox')).toHaveValue('kir')
    expect(await screen.findByText('Kira')).toBeInTheDocument()
  })

  it('labels the section and sub-tab panels by their tabs', () => {
    seedSocial({})
    act(() => useNavigationStore.getState().navigate('social'))
    render(<SocialPage />)
    const [section, subTab] = screen.getAllByRole('tabpanel')
    expect(section).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('tab', { name: 'Friends' }).id
    )
    expect(subTab).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('tab', { name: 'My friends' }).id
    )
  })

  it('opens the organisations section, its waiting invitations counted in the sidebar', async () => {
    seedSocial({ invitations: [organisationRequest(4)] })
    act(() => useNavigationStore.getState().navigate('social'))
    render(<SocialPage />)
    const sidebar = screen.getByRole('tablist', { name: 'Social' })
    await userEvent.click(
      await within(sidebar).findByRole('tab', { name: /Organizations.*1 request waiting/ })
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Organizations' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'My organizations' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it("opens the player's own sheet from the sidebar", async () => {
    seedSocial({ selfId: 'me' })
    act(() => useNavigationStore.getState().navigate('social'))
    render(<SocialPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'My profile' })).toBeEnabled())
    await userEvent.click(screen.getByRole('button', { name: 'My profile' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'player',
      subject: { id: 'me' }
    })
  })
})
