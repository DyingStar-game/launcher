import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LauncherUpdateState } from '@shared/types/launcherUpdate'

const api = vi.mocked(window.api)

/** The store, imported fresh, and the push it subscribed to. */
async function loadStore(): Promise<{
  store: typeof import('./launcherUpdate').useLauncherUpdateStore
  push: (state: LauncherUpdateState) => void
}> {
  vi.resetModules()
  const { useLauncherUpdateStore } = await import('./launcherUpdate')
  const push = api.onLauncherUpdateState.mock.calls[0][0]
  return { store: useLauncherUpdateStore, push }
}

beforeEach(() => {
  api.getLauncherUpdateState.mockResolvedValue({ status: 'checking' })
})

describe('launcher update store', () => {
  it('reads the state main already has, then follows its pushes', async () => {
    const { store, push } = await loadStore()
    await vi.waitFor(() => expect(store.getState().update).toEqual({ status: 'checking' }))
    push({ status: 'downloading', version: '1.4.0', percent: 12 })
    expect(store.getState().update).toEqual({
      status: 'downloading',
      version: '1.4.0',
      percent: 12
    })
  })

  it('tells a failed download, not a failed check', async () => {
    const { store, push } = await loadStore()
    push({ status: 'checking' })
    push({ status: 'error' })
    expect(store.getState().failed).toBe(false)
    push({ status: 'downloading', version: '1.4.0', percent: 50 })
    push({ status: 'error' })
    expect(store.getState().failed).toBe(true)
  })

  it('stops waiting when main refuses the install', async () => {
    api.installLauncherUpdate.mockResolvedValue(false)
    const { store } = await loadStore()
    await expect(store.getState().install()).resolves.toBe(false)
    expect(store.getState().installing).toBe(false)
  })
})
