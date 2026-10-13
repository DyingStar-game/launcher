import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEnvStore } from './env'
import { useFilesStore } from './files'
import { useGameStore } from './game'
import { useVersionStore } from './version'

const savedVersions = useVersionStore.getState().latestGameVersions

const api = vi.mocked(window.api)

/** The latest testing build the API answers. */
function online(version: string): void {
  api.checkGameVersions.mockResolvedValue({
    universe: { version: null, releaseDate: null },
    'universe-testing': { version, releaseDate: null }
  })
}

/** The version.json of the installed game. */
function installed(version: string): void {
  api.resolveInstalledVersion.mockResolvedValue({ version, releaseDate: '2026-10-10' })
}

beforeEach(() => {
  useVersionStore.setState({ latestGameVersions: savedVersions })
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
    await expect(useGameStore.getState().play()).resolves.toBe('launched')
    expect(api.launchGame).toHaveBeenCalledWith('universe-testing', '/games')
    expect(useGameStore.getState().isLaunching).toBe(false)
  })

  it('does not launch an outdated client (ADR 0039)', async () => {
    online('20261013000000')
    await expect(useGameStore.getState().play()).resolves.toBe('updateRequired')
    expect(api.checkGameVersions).toHaveBeenCalledOnce()
    expect(api.launchGame).not.toHaveBeenCalled()
    expect(useGameStore.getState().isLaunching).toBe(false)
  })

  it('reads version.json again: an older one changed on disk needs an update', async () => {
    online('20261010000000')
    installed('20261001000000')
    await expect(useGameStore.getState().play()).resolves.toBe('updateRequired')
    expect(api.launchGame).not.toHaveBeenCalled()
  })

  it('launches when the version cannot be checked', async () => {
    api.checkGameVersions.mockRejectedValue(new Error('offline'))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(useGameStore.getState().play()).resolves.toBe('launched')
    expect(api.launchGame).toHaveBeenCalledOnce()
  })
})
