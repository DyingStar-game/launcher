import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import { useChangelogStore } from '@stores/changelog'
import { seedSocial } from '../../../test/seedSocial'
import UniverseBar from './UniverseBar'

beforeEach(() => {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe' })
    useNavigationStore.getState().navigate('social')
  })
})

describe('UniverseBar', () => {
  it('counts the unread versions on the Changelog button', () => {
    const { unreadCount } = useChangelogStore.getState()
    act(() => useChangelogStore.setState({ unreadCount: () => 3 }))
    render(<UniverseBar />)
    expect(screen.getByRole('button', { name: /Changelog.*3 new versions/ })).toBeInTheDocument()
    act(() => useChangelogStore.setState({ unreadCount }))
  })

  it('keeps Social highlighted on a player page', () => {
    act(() => useNavigationStore.getState().openPlayer('p1'))
    render(<UniverseBar />)
    expect(screen.getByRole('button', { name: 'Social' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'Changelog' })).not.toHaveAttribute('aria-current')
  })

  it('navigates to a section with a fresh history', async () => {
    act(() => useNavigationStore.getState().openPlayer('p1'))
    render(<UniverseBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Changelog' }))
    expect(useNavigationStore.getState()).toMatchObject({ currentView: 'changelog', history: [] })
  })

  it("goes back to the active universe's home", async () => {
    act(() => useEnvStore.setState({ activeEnv: 'universe-testing' }))
    render(<UniverseBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Home' }))
    expect(useNavigationStore.getState().currentView).toBe('universe-testing')
    expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-current', 'true')
  })

  it('says when the testing environment is shown, and only then', () => {
    const { rerender } = render(<UniverseBar />)
    expect(screen.queryAllByText('Testing environment')).toHaveLength(0)
    act(() => useEnvStore.setState({ activeEnv: 'universe-testing' }))
    rerender(<UniverseBar />)
    // In the bar, and in the strip that replaces it on narrow windows
    expect(screen.getAllByText('Testing environment')).toHaveLength(2)
  })

  it('holds the account', () => {
    render(<UniverseBar />)
    expect(screen.getByRole('navigation', { name: 'Universe sections' })).toContainElement(
      screen.getByRole('button', { name: /Sign in with Discord|Sign-in is not available/ })
    )
  })
  it('opens a section from the menu used on narrow windows', async () => {
    render(<UniverseBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Universe sections: Social' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Changelog' }))
    expect(useNavigationStore.getState().currentView).toBe('changelog')
  })
  it('counts the friend and organisation requests waiting on the Social button', async () => {
    seedSocial(
      {
        incoming: [{ id: 1, playerId: 'p1', name: 'Kira' }],
        invitations: [{ id: 2, organisation: { id: 'c1', name: 'Nova', ticker: 'NOVA' } }]
      },
      'universe'
    )
    render(<UniverseBar />)
    expect(
      await screen.findByRole('button', { name: /Social.*2 requests waiting/ })
    ).toBeInTheDocument()
  })
})
