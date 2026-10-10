import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigationStore } from '@stores/navigation'

/**
 * A value of the current page's state (ADR 0013), restored when Back returns to this page.
 * Re-renders only when this key changes.
 */
export function usePageState<T>(key: string, initial: T): [T, (value: T) => void] {
  const value = useNavigationStore((s) => s.pageState[key] as T | undefined)
  const setPageState = useNavigationStore((s) => s.setPageState)
  const set = useCallback((next: T) => setPageState({ [key]: next }), [key, setPageState])
  return [value === undefined ? initial : value, set]
}

/**
 * Remembers the scroll position of an element in the page state (ADR 0013): saved while
 * scrolling, restored once `ready` (the content is there). Attach the returned ref.
 */
export function useScrollMemory<T extends HTMLElement>(
  key: string,
  ready = true
): React.RefObject<T | null> {
  const ref = useRef<T>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!ready || !el) return
    const saved = useNavigationStore.getState().pageState[key]
    if (typeof saved === 'number') el.scrollTop = saved
  }, [key, ready])

  useEffect(() => {
    const el = ref.current
    if (!ready || !el) return
    let frame = 0
    const onScroll = (): void => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() =>
        useNavigationStore.getState().setPageState({ [key]: el.scrollTop })
      )
    }
    el.addEventListener('scroll', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [key, ready])

  return ref
}
