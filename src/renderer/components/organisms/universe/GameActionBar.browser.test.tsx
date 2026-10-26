import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { act, render, screen } from '../../../test/render'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import GameActionBar from './GameActionBar'

// The status queries have their own tests: an online server, an available sign-in
vi.mock('@hooks/status/useServerStatus', () => ({
  useServerStatus: () => ({ status: 'online', players: 0 })
}))
vi.mock('@hooks/status/useAuthAvailability', () => ({ useAuthAvailability: () => true }))

const savedFiles = useFilesStore.getState()
const box = (el: Element): DOMRect => el.getBoundingClientRect()

beforeEach(async () => {
  await page.viewport(1024, 768)
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useAvailabilityStore.setState({ available: { universe: false, 'universe-testing': true } })
    useFilesStore.setState((s) => ({
      syncInstalledVersions: vi.fn(() => Promise.resolve()),
      data: {
        ...s.data,
        'universe-testing': {
          ...s.data['universe-testing'],
          installed: false,
          installPath: '/home/someone/a/very/long/path/to/the/games/folder/of/the/player/dyingstar'
        }
      }
    }))
  })
})

afterEach(async () => {
  act(() => {
    useFilesStore.setState(savedFiles, true)
  })
  await page.viewport(1400, 900)
})

describe('GameActionBar (rendering)', () => {
  it('fits the minimum window, the main action and the files button at full size', () => {
    render(<GameActionBar />)
    const install = box(screen.getByRole('button', { name: 'Install' }))
    const files = box(screen.getByRole('button', { name: 'Game files' }))
    expect(install.width).toBe(280)
    expect(install.height).toBe(64)
    expect(files.width).toBe(56)
    expect(install.right).toBe(1024 - 28)
    // A long folder is cut, it does not push the buttons out
    expect(files.right).toBeLessThan(install.left)
  })

  it('opens the files panel above its button, inside the window', async () => {
    render(<GameActionBar />)
    const files = box(screen.getByRole('button', { name: 'Game files' }))
    const panel = screen.getByRole('dialog', { name: 'Game files' })
    await expect.poll(() => box(panel).bottom).toBeLessThanOrEqual(files.top)
    expect(box(panel).right).toBeLessThanOrEqual(1024)
    expect(box(panel).width).toBe(420)
  })

  it('puts Cancel above the end of the progress, on the speed line, Pause in the main action', () => {
    act(() =>
      useFilesStore.setState((s) => ({
        data: {
          ...s.data,
          'universe-testing': {
            ...s.data['universe-testing'],
            installing: true,
            progress: 30,
            progressEvent: { key: 'downloading', downloaded: 300, total: 1000 },
            bytesPerSecond: 100
          }
        }
      }))
    )
    render(<GameActionBar />)
    const progress = box(screen.getByRole('progressbar'))
    const cancel = box(screen.getByRole('button', { name: 'Cancel the download' }))
    const speed = box(screen.getByText(/B\/s/))
    expect(cancel.right).toBe(progress.right)
    expect(cancel.bottom).toBeLessThanOrEqual(progress.top)
    // Level with the bottom of the speed line: the same spacing to the progress as the text
    expect(cancel.bottom).toBe(speed.bottom)
    expect(cancel.height).toBe(36)
    // Laid over the line: the progress stays as close to the text as without it
    expect(progress.top - speed.bottom).toBeLessThan(12)
    // Everything still fits the bar
    const bar = box(screen.getByRole('progressbar').closest('.h-26')!)
    expect(cancel.top).toBeGreaterThanOrEqual(bar.top)
    expect(progress.bottom).toBeLessThanOrEqual(bar.bottom)
    expect(box(screen.getByRole('button', { name: 'Pause' })).width).toBe(280)
  })
})
