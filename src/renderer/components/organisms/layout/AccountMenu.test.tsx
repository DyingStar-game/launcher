import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
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
    useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
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
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(login).toHaveBeenCalledOnce()
  })

  it('cancels while the sign-in window is open', async () => {
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
})
