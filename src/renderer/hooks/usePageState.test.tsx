import { describe, expect, it } from 'vitest'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useNavigationStore } from '@stores/navigation'
import { usePageState, useScrollMemory } from './usePageState'

describe('usePageState', () => {
  it('reads the initial value, writes into the page state, and comes back with Back', () => {
    const { result } = renderHook(() => usePageState('tab', 'friends'))
    expect(result.current[0]).toBe('friends')
    act(() => result.current[1]('players'))
    expect(result.current[0]).toBe('players')

    act(() => useNavigationStore.getState().openPlayer('p1'))
    expect(result.current[0]).toBe('friends')
    act(() => useNavigationStore.getState().back())
    expect(result.current[0]).toBe('players')
  })
})

function Scroller({ ready }: { ready: boolean }): React.JSX.Element {
  const ref = useScrollMemory<HTMLDivElement>('scroll', ready)
  return <div ref={ref} data-testid="scroller" />
}

describe('useScrollMemory', () => {
  it('restores the saved position once ready', () => {
    act(() => useNavigationStore.getState().setPageState({ scroll: 240 }))
    const { rerender } = render(<Scroller ready={false} />)
    expect(screen.getByTestId('scroller').scrollTop).toBe(0)
    rerender(<Scroller ready />)
    expect(screen.getByTestId('scroller').scrollTop).toBe(240)
  })

  it('saves the position while scrolling', async () => {
    render(<Scroller ready />)
    const el = screen.getByTestId('scroller')
    el.scrollTop = 90
    el.dispatchEvent(new Event('scroll'))
    await waitFor(() => expect(useNavigationStore.getState().pageState.scroll).toBe(90))
  })
})
