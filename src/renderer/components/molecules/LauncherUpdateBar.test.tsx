import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import LauncherUpdateBar from './LauncherUpdateBar'

describe('LauncherUpdateBar', () => {
  it('opens the download page of the new version', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<LauncherUpdateBar version="1.4.0" downloadUrl="https://example/releases/1.4.0" />)
    expect(screen.getByRole('status')).toHaveTextContent('New launcher version available · 1.4.0')
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(open).toHaveBeenCalledWith('https://example/releases/1.4.0', '_blank')
    open.mockRestore()
  })

  it('names the file it downloads', () => {
    render(
      <LauncherUpdateBar
        version="1.4.0"
        downloadUrl="https://example/launcher_1.4.0_amd64.deb"
        downloadLabel="Download the .deb"
      />
    )
    expect(screen.getByRole('button', { name: 'Download the .deb' })).toBeInTheDocument()
  })

  it('only tells without a download page', () => {
    render(<LauncherUpdateBar version="1.4.0" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the background download progress', () => {
    render(<LauncherUpdateBar version="1.4.0" progress={42} downloadUrl="https://example" />)
    expect(screen.getByRole('status')).toHaveTextContent('Downloading the new launcher · 1.4.0')
    expect(
      screen.getByRole('progressbar', { name: 'Downloading the new launcher' })
    ).toHaveAttribute('aria-valuenow', '42')
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('restarts on the downloaded launcher', async () => {
    const onRestart = vi.fn()
    render(<LauncherUpdateBar version="1.4.0" onRestart={onRestart} note="installed on quit" />)
    expect(screen.getByRole('status')).toHaveTextContent(
      'New launcher ready · 1.4.0 · installed on quit'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Restart to update' }))
    expect(onRestart).toHaveBeenCalledOnce()
  })

  it('says why the restart waits', async () => {
    const onRestart = vi.fn()
    render(
      <LauncherUpdateBar
        version="1.4.0"
        onRestart={onRestart}
        restartBlockedReason="Available once the game is closed"
      />
    )
    const button = screen.getByRole('button', { name: 'Restart to update' })
    expect(button).toBeDisabled()
    await userEvent.hover(button.parentElement!)
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Available once the game is closed'
    )
  })
})
