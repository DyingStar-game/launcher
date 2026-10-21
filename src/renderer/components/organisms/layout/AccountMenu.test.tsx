import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import { seedSocial } from '../../../test/seedSocial'
import AccountMenu from './AccountMenu'

const saved = useAccountStore.getState()
const login = vi.fn(() => Promise.resolve())
const logout = vi.fn(() => Promise.resolve())
const cancelLogin = vi.fn()

/** The active environment's account, signed in or not. */
function account(status: 'connected' | 'disconnected' | 'loading', username?: string): void {
  act(() =>
    useAccountStore.setState((s) => ({
      login,
      logout,
      cancelLogin,
      data: { ...s.data, universe: { status, username } }
    }))
  )
}

beforeEach(() => {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe' })
    useAvailabilityStore.setState({
      available: { universe: true, 'universe-testing': true },
      authAvailable: { universe: true, 'universe-testing': true }
    })
  })
})

afterEach(() => {
  act(() => useAccountStore.setState(saved, true))
  vi.clearAllMocks()
})

describe('AccountMenu', () => {
  it('signs in with Discord when signed out', async () => {
    account('disconnected')
    render(<AccountMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Discord' }))
    expect(login).toHaveBeenCalledOnce()
  })

  it('cancels while waiting for the sign-in in the browser', async () => {
    account('loading')
    render(<AccountMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel sign-in' }))
    expect(cancelLogin).toHaveBeenCalledOnce()
  })

  it('opens the signed-in player menu, where they sign out', async () => {
    account('connected', 'Kira')
    render(<AccountMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Account of Kira' }))
    expect(await screen.findByText('Signed in as Kira')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(logout).toHaveBeenCalledOnce()
  })

  it("opens the player's own sheet from My profile", async () => {
    seedSocial({ selfId: 'p-kira' }, 'universe')
    account('connected', 'Kira')
    render(<AccountMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Account of Kira' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'My profile' }))
    expect(useNavigationStore.getState()).toMatchObject({
      currentView: 'player',
      subject: { id: 'p-kira', env: 'universe' }
    })
  })

  it('says why sign-in is off when the environment has none', () => {
    act(() =>
      useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
    )
    account('disconnected')
    render(<AccountMenu />)
    expect(
      screen.getByRole('button', { name: 'Sign-in is not available for this environment.' })
    ).toBeDisabled()
  })

  it('says sign-in is unavailable while the sign-in server does not answer', () => {
    act(() =>
      useAvailabilityStore.setState({
        authAvailable: { universe: false, 'universe-testing': true }
      })
    )
    account('disconnected')
    render(<AccountMenu />)
    expect(
      screen.getByRole('button', {
        name: 'The sign-in server is not responding. Try again later.'
      })
    ).toBeDisabled()
    expect(screen.getByText('Sign-in unavailable')).toBeInTheDocument()
  })

  it('keeps the signed-in player menu while the sign-in server does not answer', () => {
    act(() =>
      useAvailabilityStore.setState({
        authAvailable: { universe: false, 'universe-testing': true }
      })
    )
    account('connected', 'Kira')
    render(<AccountMenu />)
    expect(screen.getByRole('button', { name: 'Account of Kira' })).toBeEnabled()
  })
})
