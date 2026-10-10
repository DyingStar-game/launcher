import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import FilesPanel from './FilesPanel'

beforeEach(() => {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
    const { data } = useFilesStore.getState()
    useFilesStore.setState({
      data: {
        ...data,
        'universe-testing': { ...data['universe-testing'], installed: true, installPath: '/games' }
      },
      syncInstalledVersions: vi.fn(() => Promise.resolve())
    })
  })
})

describe('FilesPanel', () => {
  it('confirms a cleared cache in a success toast', async () => {
    vi.mocked(window.api.clearGodotGameCache).mockResolvedValue({
      root: '/cache',
      removed: ['a'],
      skipped: [],
      errors: []
    })
    render(<FilesPanel />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear cache' }))
    expect(await screen.findByText('Cache cleared.')).toHaveClass('text-emerald-200')
  })

  it('warns when the cache is only partly cleared', async () => {
    vi.mocked(window.api.clearGodotGameCache).mockResolvedValue({
      root: '/cache',
      removed: [],
      skipped: [],
      errors: [{ path: '/cache/x', message: 'busy' }]
    })
    render(<FilesPanel />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear cache' }))
    expect(
      await screen.findByText('Cache partially cleared (some folders could not be removed).')
    ).toHaveClass('text-amber-100')
  })
})
