import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useVersionStore } from '@stores/version'
import { useLauncherUpdateStore } from '@stores/launcherUpdate'
import { useGameStore } from '@stores/game'
import { useFilesStore } from '@stores/files'
import type { LauncherUpdateState } from '@shared/types/launcherUpdate'
import { Toaster } from '@components/ui/sonner'
import LauncherUpdateBanner from './LauncherUpdateBanner'

const saved = {
  version: useVersionStore.getState(),
  update: useLauncherUpdateStore.getState(),
  game: useGameStore.getState(),
  files: useFilesStore.getState()
}
const install = vi.fn(() => Promise.resolve(true))

/** Where the in-place update stands. */
function update(state: LauncherUpdateState): void {
  act(() => useLauncherUpdateStore.setState({ update: state }))
}

/** What the release check found. */
function release(version: string | null): void {
  act(() =>
    useVersionStore.setState({
      latestLauncherVersion: version,
      launcherUpdateAvailable: version !== null
    })
  )
}

beforeEach(() => {
  vi.stubEnv('VITE_LAUNCHER_GITHUB_REPO_URL', 'https://github.com/DyingStar-game/launcher')
  act(() => useLauncherUpdateStore.setState({ install }))
})

afterEach(() => {
  act(() => {
    useVersionStore.setState(saved.version, true)
    useLauncherUpdateStore.setState(saved.update, true)
    useGameStore.setState(saved.game, true)
    useFilesStore.setState(saved.files, true)
  })
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('LauncherUpdateBanner', () => {
  it('shows nothing while the launcher is up to date', () => {
    update({ status: 'idle' })
    release(null)
    const { container } = render(<LauncherUpdateBanner />)
    expect(container).toBeEmptyDOMElement()
  })

  it('links to the release where the launcher cannot update itself', () => {
    update({ status: 'unsupported' })
    release('1.4.0')
    render(<LauncherUpdateBanner />)
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })

  it('downloads the new deb directly where the launcher was installed from one', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    update({ status: 'unsupported' })
    release('1.4.0')
    const deb = 'https://github.com/DyingStar-game/launcher/releases/download/v1.4.0/launcher.deb'
    act(() =>
      useVersionStore.setState({ latestLauncherDownloadUrl: deb, launcherPackageType: 'deb' })
    )
    render(<LauncherUpdateBanner />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'New launcher version available · 1.4.0 · the AppImage version updates itself'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Download the .deb' }))
    expect(open).toHaveBeenCalledWith(deb, '_blank')
    open.mockRestore()
  })

  it('shows no link while the updater checks, it would only flash', () => {
    update({ status: 'checking' })
    release('1.4.0')
    render(<LauncherUpdateBanner />)
    expect(screen.getByRole('status')).toHaveTextContent('New launcher version available · 1.4.0')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the download, then restarts on the new launcher', async () => {
    release('1.4.0')
    update({ status: 'downloading', version: '1.4.0', percent: 30 })
    render(<LauncherUpdateBanner />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30')
    update({ status: 'ready', version: '1.4.0' })
    await userEvent.click(screen.getByRole('button', { name: 'Restart to update' }))
    expect(install).toHaveBeenCalledOnce()
  })

  it('waits for the game to close before restarting', () => {
    update({ status: 'ready', version: '1.4.0' })
    act(() => useGameStore.setState({ gameRunning: true }))
    render(<LauncherUpdateBanner />)
    expect(screen.getByRole('button', { name: 'Restart to update' })).toBeDisabled()
  })

  it('waits for a game install to end before restarting', () => {
    update({ status: 'ready', version: '1.4.0' })
    act(() =>
      useFilesStore.setState((s) => ({
        data: { ...s.data, universe: { ...s.data.universe, installing: true } }
      }))
    )
    render(<LauncherUpdateBanner />)
    expect(screen.getByRole('button', { name: 'Restart to update' })).toBeDisabled()
  })

  it('tells a failed update in a toast, and links to the release', async () => {
    release('1.4.0')
    update({ status: 'error' })
    act(() => useLauncherUpdateStore.setState({ failed: true }))
    render(
      <>
        <LauncherUpdateBanner />
        <Toaster />
      </>
    )
    const message = await screen.findByText(
      'The launcher update failed: it can be downloaded from its page'
    )
    expect(message.closest('[data-sonner-toast]')).not.toBeNull()
    expect(useLauncherUpdateStore.getState().failed).toBe(false)
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
  })
})
