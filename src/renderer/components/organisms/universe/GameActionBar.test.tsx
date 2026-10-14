import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useFilesStore, type EnvFilesData, type InstallRunOutcome } from '@stores/files'
import { useGameStore, type PlayOutcome } from '@stores/game'
import { useVersionStore } from '@stores/version'
import { pollIntervalMinutes } from '@lib/env'
import type { ServerStatusValue } from '@shared/types/game'
import { Toaster } from '@components/ui/sonner'
import GameActionBar from './GameActionBar'

const saved = {
  account: useAccountStore.getState(),
  files: useFilesStore.getState(),
  game: useGameStore.getState(),
  version: useVersionStore.getState()
}
const login = vi.fn(() => Promise.resolve())
const install = vi.fn(() => Promise.resolve<InstallRunOutcome>('installed'))
const play = vi.fn(() => Promise.resolve<PlayOutcome>('launched'))

/** The testing environment's files. */
function files(patch: Partial<EnvFilesData>): void {
  act(() =>
    useFilesStore.setState((s) => ({
      data: { ...s.data, 'universe-testing': { ...s.data['universe-testing'], ...patch } }
    }))
  )
}

/** The testing environment's account. */
function account(status: 'connected' | 'disconnected' | 'loading', sessionExpired = false): void {
  act(() =>
    useAccountStore.setState((s) => ({
      data: { ...s.data, 'universe-testing': { status, sessionExpired } }
    }))
  )
}

/** The testing server's status. */
function server(status: ServerStatusValue): void {
  act(() =>
    useGameStore.setState((s) => ({
      data: { ...s.data, 'universe-testing': { status, players: 2 } }
    }))
  )
}

/** The latest testing build online. */
function latest(version: string): void {
  act(() =>
    useVersionStore.setState((s) => ({
      latestGameVersions: {
        ...s.latestGameVersions,
        'universe-testing': { version, releaseDate: null }
      }
    }))
  )
}

beforeEach(() => {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
    useAccountStore.setState({ login })
    useFilesStore.setState({ install, syncInstalledVersions: vi.fn(() => Promise.resolve()) })
    useGameStore.setState({ play, fetchServerStatus: vi.fn(() => Promise.resolve()) })
  })
  files({ installed: true, installPath: '/games', version: '20261010203221' })
  latest('20261010203221')
  server('online')
  account('connected')
})

afterEach(() => {
  act(() => {
    useAccountStore.setState(saved.account, true)
    useFilesStore.setState(saved.files, true)
    useGameStore.setState(saved.game, true)
    useVersionStore.setState(saved.version, true)
  })
  vi.clearAllMocks()
})

describe('GameActionBar', () => {
  it('plays when everything is ready', async () => {
    render(<GameActionBar />)
    expect(screen.getByText('Ready to play')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Available' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))
    expect(play).toHaveBeenCalledOnce()
  })

  it('tells an update is needed when Play finds a newer version online', async () => {
    play.mockResolvedValueOnce('updateRequired')
    render(
      <>
        <GameActionBar />
        <Toaster />
      </>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Play' }))
    const message = await screen.findByText(
      'A new version of the game is available: update required before playing.'
    )
    expect(message.closest('[data-sonner-toast]')).not.toBeNull()
  })

  it('opens the files panel by itself while the game is not installed', async () => {
    files({ installed: false, installPath: '', version: null })
    render(<GameActionBar />)
    expect(screen.getByText('No install folder chosen')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Game files' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('asks for a folder before installing', async () => {
    files({ installed: false, installPath: '', version: null })
    render(<GameActionBar />)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Install' }))
    expect(install).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Game files' })).toHaveTextContent(
      'Select an install folder'
    )
  })

  it('installs into the chosen folder', async () => {
    files({ installed: false, installPath: '/games', version: null })
    render(<GameActionBar />)
    expect(screen.getByText('In /games')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Install' }))
    expect(install).toHaveBeenCalledOnce()
  })

  it('shows the progress, speed and time left while downloading', () => {
    files({
      installed: false,
      installing: true,
      progress: 43,
      progressEvent: { key: 'downloading', downloaded: 100 * 1024 ** 2, total: 1124 * 1024 ** 2 },
      bytesPerSecond: 4 * 1024 ** 2
    })
    render(<GameActionBar />)
    expect(screen.getByRole('progressbar', { name: 'Installing… 43 %' })).toBeInTheDocument()
    expect(screen.getByText('100.0 MB / 1.1 GB · 4.0 MB/s · ~5 min')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeEnabled()
  })

  it('pauses from the main action or cancels while downloading, not once extracting', async () => {
    files({
      installed: false,
      installing: true,
      progressEvent: { key: 'downloading', downloaded: 1, total: 2 }
    })
    const { rerender } = render(<GameActionBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(window.api.pauseInstall).toHaveBeenCalledWith('universe-testing')
    await userEvent.click(screen.getByRole('button', { name: 'Cancel the download' }))
    expect(window.api.cancelInstall).toHaveBeenCalledWith('universe-testing', '/games')

    files({ progressEvent: { key: 'extracting', current: 1, total: 9 } })
    rerender(<GameActionBar />)
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel the download' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Installing…' })).toBeDisabled()
  })

  it('shows at once that the pause is on its way, until main stops the download', async () => {
    files({
      installed: false,
      installing: true,
      progressEvent: { key: 'downloading', downloaded: 1, total: 2 }
    })
    let answer: (stopped: boolean) => void = () => {}
    vi.mocked(window.api.pauseInstall).mockReturnValue(new Promise((r) => (answer = r)))
    render(<GameActionBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }))
    expect(screen.getByRole('button', { name: 'Pause' })).toHaveAttribute('aria-busy', 'true')
    // Too late (extraction started): the button comes back
    await act(async () => answer(false))
    expect(screen.getByRole('button', { name: 'Pause' })).not.toHaveAttribute('aria-busy')
  })

  it('cancels with a destructive button', () => {
    files({ installed: false, version: null, paused: { downloaded: 1, total: 2, progress: 35 } })
    render(<GameActionBar />)
    expect(screen.getByRole('button', { name: 'Cancel the download' })).toHaveAttribute(
      'data-variant',
      'danger'
    )
  })

  it('goes straight from downloading to paused when main pauses', async () => {
    files({ installed: false, version: null, paused: { downloaded: 1, total: 2, progress: 35 } })
    vi.mocked(window.api.installGame).mockResolvedValue({ status: 'paused' })
    vi.mocked(window.api.pendingDownload).mockResolvedValue({
      downloaded: 3,
      total: 4,
      progress: 52
    })
    render(<GameActionBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(await screen.findByRole('progressbar', { name: 'Paused · 52 %' })).toBeInTheDocument()
  })

  it('resumes a paused install', async () => {
    files({
      installed: false,
      version: null,
      paused: { downloaded: 512 * 1024 ** 2, total: 1024 ** 3, progress: 35 }
    })
    vi.mocked(window.api.installGame).mockResolvedValue({ status: 'paused' })
    render(<GameActionBar />)
    expect(screen.getByRole('progressbar', { name: 'Paused · 35 %' })).toBeInTheDocument()
    expect(screen.getByText('512.0 MB / 1.0 GB')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(window.api.installGame).toHaveBeenCalledWith('universe-testing', '/games')
  })

  it('tells the download was interrupted, kept to resume', async () => {
    const pending = { downloaded: 512 * 1024 ** 2, total: 1024 ** 3, progress: 35 }
    files({ installed: false, version: null, paused: pending })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(window.api.installGame).mockRejectedValue(new Error('Download interrupted'))
    vi.mocked(window.api.pendingDownload).mockResolvedValue(pending)
    render(
      <>
        <GameActionBar />
        <Toaster />
      </>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
    const message = await screen.findByText('Download interrupted: the progress made is kept.')
    expect(message.closest('[data-sonner-toast]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
  })

  it('tells the installation failed when nothing could be kept', async () => {
    install.mockResolvedValueOnce('failed')
    files({ installed: false, version: null })
    render(
      <>
        <GameActionBar />
        <Toaster />
      </>
    )
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Install' }))
    expect(await screen.findByText('The installation failed.')).toBeInTheDocument()
  })

  it('cancels a paused download, back to installing', async () => {
    files({
      installed: false,
      version: null,
      paused: { downloaded: 1, total: 2, progress: 35 }
    })
    render(<GameActionBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Cancel the download' }))
    expect(window.api.cancelInstall).toHaveBeenCalledWith('universe-testing', '/games')
    expect(await screen.findByRole('button', { name: 'Install' })).toBeInTheDocument()
  })

  it('resumes a paused update, without launching the game', async () => {
    latest('20261012000000')
    files({ paused: { downloaded: 1, total: 2, progress: 35 } })
    vi.mocked(window.api.installGame).mockResolvedValue({
      status: 'installed',
      version: '20261012000000',
      releaseDate: '2026-10-12'
    })
    render(<GameActionBar />)
    await userEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(window.api.installGame).toHaveBeenCalledOnce()
    expect(await screen.findByRole('button', { name: 'Play' })).toBeEnabled()
    expect(play).not.toHaveBeenCalled()
  })

  it('updates, then offers Play without launching the game', async () => {
    latest('20261012000000')
    const update = vi.fn(async (): Promise<InstallRunOutcome> => {
      files({ version: '20261012000000' })
      return 'installed'
    })
    act(() => useFilesStore.setState({ update }))
    render(<GameActionBar />)
    expect(screen.getByText('Update required')).toBeInTheDocument()
    expect(screen.getByText('10/10/2026 20:32 → 12/10/2026 00:00')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Update' }))
    expect(update).toHaveBeenCalledOnce()
    expect(await screen.findByRole('button', { name: 'Play' })).toBeEnabled()
    expect(play).not.toHaveBeenCalled()
  })

  it('offers an update released during a maintenance once the poll sees it', () => {
    vi.useFakeTimers()
    try {
      server('maintenance')
      const refreshGameVersions = vi.fn(async () => {
        latest('20261013000000')
        server('online')
      })
      act(() => useVersionStore.setState({ refreshGameVersions }))
      render(<GameActionBar />)
      expect(refreshGameVersions).not.toHaveBeenCalled()
      act(() => vi.advanceTimersByTime(pollIntervalMinutes() * 60 * 1000))
      expect(refreshGameVersions).toHaveBeenCalledOnce()
      expect(useGameStore.getState().fetchServerStatus).toHaveBeenCalledTimes(2)
      expect(screen.getByText('Update required')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    ['offline', 'The server is currently unavailable'],
    ['maintenance', 'The server is under maintenance — launching the game is disabled.']
  ] as const)('blocks Play while the server is %s', (status, detail) => {
    server(status)
    render(<GameActionBar />)
    expect(screen.getByText(detail)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Server unavailable' })).toBeDisabled()
  })

  it('puts the Discord sign-in where Play is while signed out', async () => {
    account('disconnected')
    render(<GameActionBar />)
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in with Discord' }))
    expect(login).toHaveBeenCalledOnce()
  })

  it('asks to sign in again when the session has expired', () => {
    account('disconnected', true)
    render(<GameActionBar />)
    expect(screen.getByText('Your session has expired. Sign in again to play.')).toBeInTheDocument()
  })

  it('keeps Play, disabled, while the session is being checked', () => {
    account('loading')
    render(<GameActionBar />)
    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled()
  })

  it('tells the game is running', () => {
    act(() => useGameStore.setState({ gameRunning: true }))
    render(<GameActionBar />)
    expect(screen.getByRole('button', { name: 'In game' })).toBeDisabled()
  })

  it('offers nothing where the environment is unavailable', () => {
    act(() =>
      useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': false } })
    )
    render(<GameActionBar />)
    expect(screen.getByText('Installation not available for this environment.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Unavailable' })).toBeDisabled()
  })
})
