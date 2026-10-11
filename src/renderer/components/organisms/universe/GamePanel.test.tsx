import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import { useGameStore } from '@stores/game'
import GamePanel from './GamePanel'

const savedAccount = useAccountStore.getState()
const login = vi.fn(() => Promise.resolve())

/** The testing environment's account. */
function account(status: 'connected' | 'disconnected' | 'loading', sessionExpired = false): void {
  act(() =>
    useAccountStore.setState((s) => ({
      login,
      data: { ...s.data, 'universe-testing': { status, sessionExpired } }
    }))
  )
}

beforeEach(() => {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
    const { data } = useFilesStore.getState()
    useFilesStore.setState({
      data: { ...data, 'universe-testing': { ...data['universe-testing'], installed: true } },
      syncInstalledVersions: vi.fn(() => Promise.resolve())
    })
    useGameStore.setState({ fetchServerStatus: vi.fn(() => Promise.resolve()) })
  })
})

afterEach(() => {
  act(() => useAccountStore.setState(savedAccount, true))
  vi.clearAllMocks()
})

describe('GamePanel', () => {
  it('puts the Discord sign-in where Play is while signed out', async () => {
    account('disconnected')
    render(<GamePanel />)
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Discord' }))
    expect(login).toHaveBeenCalledOnce()
  })

  it('asks to sign in again when the session has expired', () => {
    account('disconnected', true)
    render(<GamePanel />)
    expect(screen.getByText('Your session has expired. Sign in again to play.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in with Discord' })).toBeInTheDocument()
  })

  it('shows Play once signed in', () => {
    account('connected')
    render(<GamePanel />)
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign in with Discord' })).not.toBeInTheDocument()
  })

  it('keeps Play, disabled, while the session is being checked', () => {
    account('loading')
    render(<GamePanel />)
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  })
})
