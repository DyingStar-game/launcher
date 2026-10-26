import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEnvStore } from './env'
import { useFilesStore } from './files'
import { useGameStore } from './game'

const api = vi.mocked(window.api)

/** Reads the latest testing build again, as the caller's query does. */
const readLatest = vi.fn<() => Promise<string | null>>()

/** The latest testing build online. */
function online(version: string | null): void {
  readLatest.mockResolvedValue(version)
}

/** The version.json of the installed game. */
function installed(version: string): void {
  api.resolveInstalledVersion.mockResolvedValue({ version, releaseDate: '2026-10-10' })
}

beforeEach(() => {
  installed('20261010000000')
  useEnvStore.setState({ activeEnv: 'universe-testing' })
  useFilesStore.setState((s) => ({
    data: {
      ...s.data,
      'universe-testing': {
        ...s.data['universe-testing'],
        installed: true,
        installPath: '/games',
        version: '20261010000000'
      }
    }
  }))
})

describe('game store play', () => {
  it('launches the game when the installed version is the latest', async () => {
    online('20261010000000')
    await expect(useGameStore.getState().play(readLatest)).resolves.toBe('launched')
    expect(api.launchGame).toHaveBeenCalledWith('universe-testing', '/games')
    expect(useGameStore.getState().isLaunching).toBe(false)
  })

  it('does not launch an outdated client (ADR 0039)', async () => {
    online('20261013000000')
    await expect(useGameStore.getState().play(readLatest)).resolves.toBe('updateRequired')
    expect(readLatest).toHaveBeenCalledOnce()
    expect(api.launchGame).not.toHaveBeenCalled()
    expect(useGameStore.getState().isLaunching).toBe(false)
  })

  it('reads version.json again: an older one changed on disk needs an update', async () => {
    online('20261010000000')
    installed('20261001000000')
    await expect(useGameStore.getState().play(readLatest)).resolves.toBe('updateRequired')
    expect(api.launchGame).not.toHaveBeenCalled()
  })

  it('launches when no latest version is known', async () => {
    online(null)
    await expect(useGameStore.getState().play(readLatest)).resolves.toBe('launched')
    expect(api.launchGame).toHaveBeenCalledOnce()
  })
})
