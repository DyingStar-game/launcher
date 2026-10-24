import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import type { Env } from '@shared/types/env'
import type { GameVersionInfo } from '@shared/types/version'
import { createQueryClient } from '@lib/queryClient'
import { statusRefetchMs } from '@lib/statusQueries'
import { useAvailabilityStore } from '@stores/availability'
import { useGameStore } from '@stores/game'
import { fetchLatestGameVersion, useLatestGameVersion } from './useLatestGameVersion'

const savedAvailability = useAvailabilityStore.getState()
const savedGame = useGameStore.getState()
let client: QueryClient

/** Provides the test's query client. */
function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return createElement(QueryClientProvider, { client }, children)
}

/** What the universes' APIs answer: the testing build, and the Universe one. */
function online(testing: string | null, universe: string | null = '20261001000000'): void {
  vi.mocked(window.api.checkGameVersions).mockResolvedValue({
    universe: { version: universe, releaseDate: null },
    'universe-testing': { version: testing, releaseDate: null }
  })
}

/** Renders the hook for the testing universe. */
function renderVersion(env: Env = 'universe-testing'): RenderHookResult<GameVersionInfo, unknown> {
  return renderHook(() => useLatestGameVersion(env), { wrapper })
}

beforeEach(() => {
  client = createQueryClient()
  act(() =>
    useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
  )
})

afterEach(() => {
  client.clear()
  vi.useRealTimers()
  act(() => {
    useAvailabilityStore.setState(savedAvailability, true)
    useGameStore.setState(savedGame, true)
  })
})

describe('useLatestGameVersion', () => {
  it('gives the latest build of the universe', async () => {
    online('20261010000000')
    const { result } = renderVersion()
    expect(result.current.version).toBeNull()
    await waitFor(() => expect(result.current.version).toBe('20261010000000'))
  })

  it('sees an update released during a maintenance at the next poll, not while playing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    online('20261010000000')
    const { result } = renderVersion()
    await waitFor(() => expect(result.current.version).toBe('20261010000000'))

    online('20261013000000')
    await act(() => vi.advanceTimersByTimeAsync(statusRefetchMs()))
    await waitFor(() => expect(result.current.version).toBe('20261013000000'))

    act(() => useGameStore.setState({ gameRunning: true }))
    await act(() => vi.advanceTimersByTimeAsync(statusRefetchMs() * 3))
    expect(window.api.checkGameVersions).toHaveBeenCalledTimes(2)
  })

  it('keeps the known version of a universe whose API does not answer', async () => {
    online('20261010000000')
    const { result } = renderVersion('universe')
    await waitFor(() => expect(result.current.version).toBe('20261001000000'))

    online('20261013000000', null)
    expect(await fetchLatestGameVersion(client, 'universe')).toBe('20261001000000')
    expect(await fetchLatestGameVersion(client, 'universe-testing')).toBe('20261013000000')
  })
})

describe('fetchLatestGameVersion', () => {
  it('reads the version again, even a fresh one, before Play', async () => {
    online('20261010000000')
    expect(await fetchLatestGameVersion(client, 'universe-testing')).toBe('20261010000000')
    online('20261013000000')
    expect(await fetchLatestGameVersion(client, 'universe-testing')).toBe('20261013000000')
  })

  it('keeps the known version when the check fails, null when none is known', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(window.api.checkGameVersions).mockRejectedValue(new Error('offline'))
    expect(await fetchLatestGameVersion(client, 'universe-testing')).toBeNull()

    online('20261010000000')
    await fetchLatestGameVersion(client, 'universe-testing')
    vi.mocked(window.api.checkGameVersions).mockRejectedValue(new Error('offline'))
    expect(await fetchLatestGameVersion(client, 'universe-testing')).toBe('20261010000000')
  })
})
