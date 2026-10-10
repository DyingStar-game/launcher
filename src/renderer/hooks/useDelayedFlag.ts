import { useEffect, useState } from 'react'

/**
 * True once `active` has stayed true for `delayMs` (ADR 0018): a loading skeleton only shows
 * when the wait is long enough to be noticed, so fast answers do not flash it.
 */
export function useDelayedFlag(active: boolean, delayMs = 150): boolean {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => setShown(true), delayMs)
    return () => {
      window.clearTimeout(id)
      setShown(false)
    }
  }, [active, delayMs])

  return active && shown
}
