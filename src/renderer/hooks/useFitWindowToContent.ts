import { useEffect } from 'react'

/**
 * Observes layout changes and asks the main process to resize the frameless window
 * so content is not clipped (respects min/max dimensions from env).
 */
export function useFitWindowToContent(): void {
  useEffect(() => {
    let rafId = 0

    /** Measures `#root` and invokes IPC resize on the next animation frame. */
    const report = (): void => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const root = document.getElementById('root')
        if (!root) return
        void window.api.fitWindowToContent({
          width: root.scrollWidth,
          height: root.scrollHeight
        })
      })
    }

    const ro = new ResizeObserver(report)
    ro.observe(document.body)

    const mo = new MutationObserver(report)
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    })

    report()

    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])
}
