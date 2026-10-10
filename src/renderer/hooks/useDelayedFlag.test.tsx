import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDelayedFlag } from './useDelayedFlag'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('useDelayedFlag', () => {
  it('turns true only after the delay', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 150))
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(149))
    expect(result.current).toBe(false)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(true)
  })

  it('never turns true when the wait ends before the delay', () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 150), {
      initialProps: { active: true }
    })
    act(() => vi.advanceTimersByTime(100))
    rerender({ active: false })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe(false)
  })

  it('turns false as soon as the wait ends', () => {
    const { result, rerender } = renderHook(({ active }) => useDelayedFlag(active, 150), {
      initialProps: { active: true }
    })
    act(() => vi.advanceTimersByTime(150))
    rerender({ active: false })
    expect(result.current).toBe(false)
  })
})
