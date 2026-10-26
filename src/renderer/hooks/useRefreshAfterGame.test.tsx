import { createElement, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { createQueryClient } from '@lib/queryClient'
import { useGameStore } from '@stores/game'
import { useRefreshAfterGame } from './useRefreshAfterGame'

const savedGame = useGameStore.getState()

afterEach(() => act(() => useGameStore.setState(savedGame, true)))

describe('useRefreshAfterGame', () => {
  it('reads the statuses, the versions and the friends again when the game exits, not when it starts', () => {
    const client = createQueryClient()
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const wrapper = ({ children }: { children: ReactNode }): React.JSX.Element =>
      createElement(QueryClientProvider, { client }, children)
    renderHook(() => useRefreshAfterGame(), { wrapper })

    act(() => useGameStore.setState({ gameRunning: true }))
    expect(invalidate).not.toHaveBeenCalled()

    act(() => useGameStore.setState({ gameRunning: false }))
    expect(invalidate.mock.calls.map(([filters]) => filters?.queryKey)).toEqual([
      ['status'],
      ['versions', 'game'],
      ['social', 'universe', 'friends'],
      ['social', 'universe-testing', 'friends']
    ])
  })
})
