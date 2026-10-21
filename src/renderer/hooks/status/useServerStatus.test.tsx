import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import type { Env } from '@shared/types/env'
import type { GameStatusResult, ServerStatusValue } from '@shared/types/game'
import { createQueryClient } from '@lib/queryClient'
import { statusKeys } from '@lib/statusQueries'
import { useAvailabilityStore } from '@stores/availability'
import { useServerStatus, type ServerStatus } from './useServerStatus'

const savedAvailability = useAvailabilityStore.getState()
let client: QueryClient

/** Provides the test's query client. */
function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return createElement(QueryClientProvider, { client }, children)
}

/** What main answers for the status page. */
function answer(status: ServerStatusValue, reached = true): GameStatusResult {
  return { status, statusLabel: '', players: 3, available: true, reached }
}

/** Renders the hook for `env`, in the test's query client. */
function renderStatus(env: Env = 'universe-testing'): RenderHookResult<ServerStatus, { env: Env }> {
  return renderHook((props: { env: Env }) => useServerStatus(props.env), {
    wrapper,
    initialProps: { env }
  })
}

beforeEach(() => {
  client = createQueryClient()
  act(() =>
    useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
  )
})

afterEach(() => {
  client.clear()
  act(() => useAvailabilityStore.setState(savedAvailability, true))
})

describe('useServerStatus', () => {
  it('is unknown until the status page answers, then gives its status and players', async () => {
    vi.mocked(window.api.getServerStatus).mockResolvedValue(answer('online'))
    const { result } = renderStatus()
    expect(result.current.status).toBe('unknown')
    await waitFor(() => expect(result.current).toEqual({ status: 'online', players: 3 }))
  })

  it('reuses a recent answer when switching universes back and forth', async () => {
    vi.mocked(window.api.getServerStatus).mockResolvedValue(answer('online'))
    const { result, rerender } = renderStatus()
    await waitFor(() => expect(result.current.status).toBe('online'))

    rerender({ env: 'universe' })
    await waitFor(() => expect(window.api.getServerStatus).toHaveBeenCalledWith('universe'))
    rerender({ env: 'universe-testing' })

    expect(result.current.status).toBe('online')
    expect(
      vi.mocked(window.api.getServerStatus).mock.calls.filter(([env]) => env === 'universe-testing')
    ).toHaveLength(1)
  })

  it('keeps the last status when the status page does not answer', async () => {
    vi.mocked(window.api.getServerStatus).mockResolvedValue(answer('online'))
    const { result } = renderStatus()
    await waitFor(() => expect(result.current.status).toBe('online'))

    vi.mocked(window.api.getServerStatus).mockResolvedValue(answer('unknown', false))
    await act(() => client.refetchQueries({ queryKey: statusKeys.server('universe-testing') }))

    await waitFor(() =>
      expect(client.getQueryState(statusKeys.server('universe-testing'))?.status).toBe('error')
    )
    expect(result.current.status).toBe('online')
  })

  it('reads nothing while the universe is unavailable', () => {
    act(() =>
      useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': false } })
    )
    const { result } = renderStatus()
    expect(result.current.status).toBe('unknown')
    expect(window.api.getServerStatus).not.toHaveBeenCalled()
  })
})
