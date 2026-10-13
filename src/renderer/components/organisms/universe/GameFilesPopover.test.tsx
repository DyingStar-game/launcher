import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import { Toaster } from '@components/ui/sonner'
import GameFilesPopover, { type GameFilesPopoverProps } from './GameFilesPopover'

const savedFiles = useFilesStore.getState()
const selectDirectory = vi.fn(() => Promise.resolve())

/** The testing environment's files. */
function files(installed: boolean, installPath: string): void {
  act(() => {
    const { data } = useFilesStore.getState()
    useFilesStore.setState({
      selectDirectory,
      data: {
        ...data,
        'universe-testing': {
          ...data['universe-testing'],
          installed,
          installPath,
          version: installed ? '20261010203221' : null,
          releaseDate: installed ? '2026-10-10' : null
        }
      }
    })
  })
}

/** The popover, opened and closed by its own button. */
function Harness(props: Omit<GameFilesPopoverProps, 'open' | 'onOpenChange'>): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return <GameFilesPopover open={open} onOpenChange={setOpen} {...props} />
}

beforeEach(() =>
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
  })
)

afterEach(() => act(() => useFilesStore.setState(savedFiles, true)))

describe('GameFilesPopover', () => {
  it('opens on its button, with the installed version and the file actions', async () => {
    files(true, '/games')
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Game files' }))
    const panel = screen.getByRole('dialog', { name: 'Game files' })
    expect(panel).toHaveTextContent('20261010203221')
    expect(panel).toHaveTextContent('10/10/2026')
    expect(screen.getByRole('textbox', { name: 'Install folder' })).toHaveValue('/games')
    expect(screen.getByRole('button', { name: 'Detect installation' })).toBeInTheDocument()
  })

  it.each([
    ['confirms a cleared cache', [], 'Cache cleared.'],
    [
      'warns when the cache is only partly cleared',
      [{ path: '/cache/x', message: 'busy' }],
      'Cache partially cleared (some folders could not be removed).'
    ]
  ])('%s, in a toast', async (_name, errors, message) => {
    files(true, '/games')
    vi.mocked(window.api.clearGodotGameCache).mockResolvedValue({
      root: '/cache',
      removed: ['a'],
      skipped: [],
      errors
    })
    render(
      <>
        <Harness />
        <Toaster />
      </>
    )
    await userEvent.click(screen.getByRole('button', { name: 'Game files' }))
    await userEvent.click(screen.getByRole('button', { name: 'Clear cache' }))
    expect((await screen.findByText(message)).closest('[data-sonner-toast]')).not.toBeNull()
  })

  it('asks for a folder when install was asked without one', async () => {
    files(false, '')
    render(<Harness pathError />)
    await userEvent.click(screen.getByRole('button', { name: 'Game files' }))
    expect(screen.getByText('Select an install folder')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Detect installation' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Browse' }))
    expect(selectDirectory).toHaveBeenCalledOnce()
  })

  it('keeps the folder while a download is paused in it', async () => {
    files(false, '/games')
    act(() =>
      useFilesStore.setState((s) => ({
        data: {
          ...s.data,
          'universe-testing': {
            ...s.data['universe-testing'],
            paused: { downloaded: 1, total: 2, progress: 35 }
          }
        }
      }))
    )
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'Game files' }))
    expect(screen.getByRole('button', { name: 'Browse' })).toBeDisabled()
  })
})
