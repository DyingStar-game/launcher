import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { GlobalChangelog } from '@shared/types/changelog'
import { createQueryClient } from '@lib/queryClient'
import { changelogKeys } from '@lib/changelogQueries'
import { useChangelogStore } from '@stores/changelog'
import { changelogFixture, item } from '../../test/changelogFixture'
import { useChangelog, useChangelogReadingStart, useChangelogUnreadCount } from './useChangelog'

const saved = useChangelogStore.getState()
let client: QueryClient

/** Provides the test's query client. */
function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return createElement(QueryClientProvider, { client }, children)
}

const fixture = changelogFixture()
const builds = (...stamps: string[]): GlobalChangelog =>
  changelogFixture({
    DyingStar: {
      ...fixture.components.DyingStar!,
      releases: stamps.map((stamp) => ({
        version: `0.1.0-dev.${stamp}`,
        date: '2026-10-14',
        yanked: false,
        dev: true,
        url: null,
        entries: { en: [item('Build')], fr: [] }
      }))
    }
  })

const OLD = '202610141000'
const NEW = '202610151000'
const OLD_TIME = Date.UTC(2026, 9, 14, 10)

beforeEach(() => {
  client = createQueryClient()
})

afterEach(() => {
  client.clear()
  act(() => useChangelogStore.setState(saved, true))
})

describe('useChangelog', () => {
  it('loads, then gives the changelog', async () => {
    const data = builds(OLD)
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(data)
    const { result } = renderHook(() => useChangelog(), { wrapper })
    expect(result.current).toEqual({ data: null, loading: true })
    await waitFor(() => expect(result.current).toEqual({ data, loading: false }))
  })

  it('says it is unavailable with no answer', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(null)
    const { result } = renderHook(() => useChangelog(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).toBeNull()
  })

  it('keeps the known changelog when a new read gets no answer', async () => {
    const data = builds(OLD)
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(data)
    const { result } = renderHook(() => useChangelog(), { wrapper })
    await waitFor(() => expect(result.current.data).toEqual(data))

    vi.mocked(window.api.fetchChangelog).mockResolvedValue(null)
    await act(() => client.invalidateQueries({ queryKey: changelogKeys.all }))
    expect(window.api.fetchChangelog).toHaveBeenCalledTimes(2)
    expect(result.current.data).toEqual(data)
  })

  it('shares one read between its users', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(builds(OLD))
    const { result } = renderHook(() => [useChangelog(), useChangelog()], { wrapper })
    await waitFor(() => expect(result.current[0]?.loading).toBe(false))
    expect(window.api.fetchChangelog).toHaveBeenCalledOnce()
  })
})

describe('useChangelogUnreadCount', () => {
  it('counts the entries since the last publication seen', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(builds(OLD, NEW))
    act(() =>
      useChangelogStore.setState({
        lastSeenByEnv: { universe: null, 'universe-testing': OLD_TIME }
      })
    )
    const { result } = renderHook(() => useChangelogUnreadCount('universe-testing'), { wrapper })
    await waitFor(() => expect(result.current).toBe(1))
  })

  it('leaves out the publications already seen', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(builds(OLD, NEW))
    act(() =>
      useChangelogStore.setState({
        lastSeenByEnv: { universe: null, 'universe-testing': 0 },
        seenTimesByEnv: { universe: [], 'universe-testing': [OLD_TIME] }
      })
    )
    const { result } = renderHook(() => useChangelogUnreadCount('universe-testing'), { wrapper })
    await waitFor(() => expect(result.current).toBe(1))
  })

  it('counts nothing without a starting point', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(builds(OLD, NEW))
    const { result } = renderHook(() => useChangelogUnreadCount('universe-testing'), { wrapper })
    await waitFor(() => expect(client.getQueryData(changelogKeys.all)).toBeTruthy())
    expect(result.current).toBe(0)
  })
})

describe('useChangelogReadingStart', () => {
  it('gives a new player their starting point once the changelog is read', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(builds(OLD, NEW))
    renderHook(() => useChangelogReadingStart(), { wrapper })
    await waitFor(() =>
      expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(OLD_TIME)
    )
  })
})
