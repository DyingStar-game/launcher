import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, onlineManager, type QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createQueryClient } from '@lib/queryClient'
import { AVAILABILITY_RETRY_MS } from '@lib/statusQueries'
import { useAvailabilityStore } from '@stores/availability'
import { useGameStore } from '@stores/game'
import { useEnvAvailability } from './useEnvAvailability'

const savedAvailability = useAvailabilityStore.getState()
const savedGame = useGameStore.getState()
const down = { universe: false, 'universe-testing': false }
const up = { universe: true, 'universe-testing': true }
let client: QueryClient

/** Provides the test's query client. */
function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return createElement(QueryClientProvider, { client }, children)
}

beforeEach(() => {
  client = createQueryClient()
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  client.clear()
  onlineManager.setOnline(true)
  act(() => {
    useAvailabilityStore.setState(savedAvailability, true)
    useGameStore.setState(savedGame, true)
  })
})

describe('useEnvAvailability', () => {
  it('checks again while an environment does not answer, then stops', async () => {
    vi.mocked(window.api.checkEnvAvailability).mockResolvedValue(down)
    renderHook(() => useEnvAvailability(), { wrapper })
    await waitFor(() => expect(window.api.checkEnvAvailability).toHaveBeenCalledTimes(1))
    expect(useAvailabilityStore.getState().available).toEqual(down)

    vi.mocked(window.api.checkEnvAvailability).mockResolvedValue(up)
    await act(() => vi.advanceTimersByTimeAsync(AVAILABILITY_RETRY_MS))
    await waitFor(() => expect(useAvailabilityStore.getState().available).toEqual(up))

    await act(() => vi.advanceTimersByTimeAsync(AVAILABILITY_RETRY_MS * 3))
    expect(window.api.checkEnvAvailability).toHaveBeenCalledTimes(2)
  })

  it('checks again when the network comes back', async () => {
    vi.mocked(window.api.checkEnvAvailability).mockResolvedValue(down)
    renderHook(() => useEnvAvailability(), { wrapper })
    await waitFor(() => expect(window.api.checkEnvAvailability).toHaveBeenCalledTimes(1))

    vi.mocked(window.api.checkEnvAvailability).mockResolvedValue(up)
    act(() => onlineManager.setOnline(false))
    act(() => onlineManager.setOnline(true))

    await waitFor(() => expect(useAvailabilityStore.getState().available).toEqual(up))
  })

  it('checks again after a failed check', async () => {
    vi.mocked(window.api.checkEnvAvailability).mockRejectedValue(new Error('ipc'))
    renderHook(() => useEnvAvailability(), { wrapper })
    await waitFor(() => expect(window.api.checkEnvAvailability).toHaveBeenCalledTimes(1))

    vi.mocked(window.api.checkEnvAvailability).mockResolvedValue(up)
    await act(() => vi.advanceTimersByTimeAsync(AVAILABILITY_RETRY_MS))
    await waitFor(() => expect(useAvailabilityStore.getState().available).toEqual(up))
  })

  it('does not check again while the game runs', async () => {
    act(() => useGameStore.setState({ gameRunning: true }))
    vi.mocked(window.api.checkEnvAvailability).mockResolvedValue(down)
    renderHook(() => useEnvAvailability(), { wrapper })
    await waitFor(() => expect(window.api.checkEnvAvailability).toHaveBeenCalledTimes(1))

    await act(() => vi.advanceTimersByTimeAsync(AVAILABILITY_RETRY_MS * 3))
    expect(window.api.checkEnvAvailability).toHaveBeenCalledTimes(1)
  })
})
