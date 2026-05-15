import { useEffect } from 'react'

/** Agrandit la fenêtre si le contenu dépasse la taille de base (min = variables d'env). */
export function useFitWindowToContent(): void {
  useEffect(() => {
    let rafId = 0

    const report = (): void => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        const root = document.getElementById('root')
        if (!root) return
        void window.api.fitWindowToContent({
          width:  root.scrollWidth,
          height: root.scrollHeight
        })
      })
    }

    const ro = new ResizeObserver(report)
    ro.observe(document.body)

    const mo = new MutationObserver(report)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true })

    report()

    return () => {
      ro.disconnect()
      mo.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])
}
