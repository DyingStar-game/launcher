import { beforeEach, describe, expect, it, vi } from 'vitest'

const checkGameVersions = vi.fn()
vi.stubGlobal('window', { api: { checkGameVersions } })

const { useVersionStore } = await import('./version')

beforeEach(() => {
  useVersionStore.setState({
    latestGameVersions: {
      universe: { version: '20261001000000', releaseDate: '2026-10-01' },
      'universe-testing': { version: '20261010000000', releaseDate: '2026-10-10' }
    }
  })
})

describe('version store', () => {
  it('refreshes the latest game versions', async () => {
    checkGameVersions.mockResolvedValue({
      universe: { version: '20261001000000', releaseDate: '2026-10-01' },
      'universe-testing': { version: '20261013000000', releaseDate: '2026-10-13' }
    })
    await useVersionStore.getState().refreshGameVersions()
    expect(useVersionStore.getState().latestGameVersions['universe-testing']).toEqual({
      version: '20261013000000',
      releaseDate: '2026-10-13'
    })
  })

  it('keeps the known version of an environment whose API does not answer', async () => {
    checkGameVersions.mockResolvedValue({
      universe: { version: null, releaseDate: null },
      'universe-testing': { version: null, releaseDate: null }
    })
    await useVersionStore.getState().refreshGameVersions()
    expect(useVersionStore.getState().latestGameVersions.universe.version).toBe('20261001000000')
  })

  it('keeps the known versions when the check fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    checkGameVersions.mockRejectedValue(new Error('offline'))
    await useVersionStore.getState().refreshGameVersions()
    expect(useVersionStore.getState().latestGameVersions['universe-testing'].version).toBe(
      '20261010000000'
    )
  })
})
