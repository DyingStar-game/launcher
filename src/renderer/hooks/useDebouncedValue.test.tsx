import { describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '../test/render'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  it('follows the value once it stops changing', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'k' }
    })
    rerender({ value: 'ki' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'kir' })
    act(() => vi.advanceTimersByTime(200))
    expect(result.current).toBe('k')
    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('kir')
    vi.useRealTimers()
  })
})
