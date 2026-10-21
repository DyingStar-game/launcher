import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '../../test/render'
import { renderHook as renderHookIn } from '@testing-library/react'
import { createQueryClient } from '@lib/queryClient'
import { socialKeys } from '@lib/socialQueries'
import { useAccountStore } from '@stores/account'
import { useGameStore } from '@stores/game'
import { seedSocial } from '../../test/seedSocial'
import { useSocialAccountSync, useSocialSnapshot } from './useSocialSnapshot'

const savedAccount = useAccountStore.getState()

/** The testing environment's account. */
function account(status: 'connected' | 'disconnected'): void {
  act(() =>
    useAccountStore.setState((s) => ({
      data: { ...s.data, 'universe-testing': { status, sessionExpired: false } }
    }))
  )
}

const savedGame = useGameStore.getState()

afterEach(() =>
  act(() => {
    useAccountStore.setState(savedAccount, true)
    useGameStore.setState(savedGame, true)
  })
)

describe('useSocialAccountSync', () => {
  it('drops the friends of a player who signs out', async () => {
    account('connected')
    seedSocial({ friends: [{ id: 'p1', name: 'Kira', status: 'online' }] })
    const { result } = renderHook(() => {
      useSocialAccountSync('universe-testing')
      return useSocialSnapshot()
    })
    await waitFor(() => expect(result.current.data.friends).toHaveLength(1))

    vi.mocked(window.api.socialLoad).mockResolvedValue({ ok: false, error: 'notSignedIn' })
    account('disconnected')
    await waitFor(() => expect(result.current.status).toBe('notSignedIn'))
    expect(result.current.data.friends).toEqual([])
  })
})

describe('useSocialSnapshot', () => {
  const kira = { id: 'p1', name: 'Kira', status: 'offline' } as const
  let client: QueryClient

  /** Renders the hook in a query client the test can drive. */
  function renderLive(livePresence: boolean): {
    result: { current: ReturnType<typeof useSocialSnapshot> }
  } {
    client = createQueryClient()
    const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element =>
      createElement(QueryClientProvider, { client }, children)
    return renderHookIn(() => useSocialSnapshot({ livePresence }), { wrapper })
  }

  afterEach(() => client.clear())

  it('shows the friends read alone when they are newer than the snapshot', async () => {
    seedSocial({ friends: [kira] })
    const { result } = renderLive(true)
    await waitFor(() => expect(window.api.socialLoadFriends).toHaveBeenCalledOnce())

    vi.mocked(window.api.socialLoadFriends).mockResolvedValue({
      ok: true,
      data: [{ ...kira, status: 'online' }]
    })
    await act(() => client.refetchQueries({ queryKey: socialKeys.friends('universe-testing') }))
    await waitFor(() => expect(result.current.data.friends[0].status).toBe('online'))
    expect(window.api.socialLoad).toHaveBeenCalledOnce()
  })

  it('does not read the friends alone where presence is not shown', async () => {
    seedSocial({ friends: [kira] })
    const { result } = renderLive(false)
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(window.api.socialLoadFriends).not.toHaveBeenCalled()
  })

  it('reads the presence every minute, except while the game runs', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      seedSocial({ friends: [kira] })
      renderLive(true)
      await waitFor(() => expect(window.api.socialLoadFriends).toHaveBeenCalledTimes(1))

      await act(() => vi.advanceTimersByTimeAsync(60_000))
      expect(window.api.socialLoadFriends).toHaveBeenCalledTimes(2)

      act(() => useGameStore.setState({ gameRunning: true }))
      await act(() => vi.advanceTimersByTimeAsync(180_000))
      expect(window.api.socialLoadFriends).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })
})
