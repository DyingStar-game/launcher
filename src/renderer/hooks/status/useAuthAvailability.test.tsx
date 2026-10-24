import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor, type RenderHookResult } from '@testing-library/react'
import { createQueryClient } from '@lib/queryClient'
import { statusKeys } from '@lib/statusQueries'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useAuthAvailability } from './useAuthAvailability'

const savedAccount = useAccountStore.getState()
const savedAvailability = useAvailabilityStore.getState()
const restoreSession = vi.fn(() => Promise.resolve())
let client: QueryClient

/** Provides the test's query client. */
function wrapper({ children }: { children: ReactNode }): React.JSX.Element {
  return createElement(QueryClientProvider, { client }, children)
}

/** Renders the hook twice, like the account block and the action bar sharing one query. */
function renderTwice(): RenderHookResult<boolean[], unknown> {
  return renderHook(
    () => [useAuthAvailability('universe-testing'), useAuthAvailability('universe-testing')],
    { wrapper }
  )
}

/** Reads the sign-in server status again, as the poll does. */
async function poll(): Promise<void> {
  await act(() => client.refetchQueries({ queryKey: statusKeys.auth('universe-testing') }))
}

beforeEach(() => {
  client = createQueryClient()
  act(() => {
    useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
    useAccountStore.setState((s) => ({
      restoreSession,
      data: { ...s.data, 'universe-testing': { status: 'disconnected' } }
    }))
  })
})

afterEach(() => {
  client.clear()
  act(() => {
    useAccountStore.setState(savedAccount, true)
    useAvailabilityStore.setState(savedAvailability, true)
  })
})

describe('useAuthAvailability', () => {
  it('lets sign-in on until the status page says the sign-in server is down', async () => {
    vi.mocked(window.api.checkAuthAvailability).mockResolvedValue(false)
    const { result } = renderTwice()
    expect(result.current).toEqual([true, true])
    await waitFor(() => expect(result.current).toEqual([false, false]))
    expect(window.api.checkAuthAvailability).toHaveBeenCalledOnce()
  })

  it('does not block sign-in when the status page never answered', async () => {
    vi.mocked(window.api.checkAuthAvailability).mockResolvedValue(null)
    const { result } = renderTwice()
    await waitFor(() => expect(window.api.checkAuthAvailability).toHaveBeenCalled())
    expect(result.current).toEqual([true, true])
  })

  it('keeps the sign-in server down when the status page stops answering', async () => {
    vi.mocked(window.api.checkAuthAvailability).mockResolvedValue(false)
    const { result } = renderTwice()
    await waitFor(() => expect(result.current).toEqual([false, false]))

    vi.mocked(window.api.checkAuthAvailability).mockResolvedValue(null)
    await poll()
    await waitFor(() =>
      expect(client.getQueryState(statusKeys.auth('universe-testing'))?.status).toBe('error')
    )
    expect(result.current).toEqual([false, false])
  })

  it('restores the kept session once when the sign-in server comes back', async () => {
    vi.mocked(window.api.checkAuthAvailability).mockResolvedValue(false)
    const { result } = renderTwice()
    await waitFor(() => expect(result.current).toEqual([false, false]))
    expect(restoreSession).not.toHaveBeenCalled()

    vi.mocked(window.api.checkAuthAvailability).mockResolvedValue(true)
    await poll()
    await waitFor(() => expect(result.current).toEqual([true, true]))
    expect(restoreSession).toHaveBeenCalledOnce()
    expect(restoreSession).toHaveBeenCalledWith('universe-testing')
  })
})
