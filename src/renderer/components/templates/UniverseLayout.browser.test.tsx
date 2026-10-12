import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import UniverseLayout from './UniverseLayout'

const region = (name: string): DOMRect =>
  screen.getByRole('region', { name }).getBoundingClientRect()
const box = (el: Element): DOMRect => el.getBoundingClientRect()

describe('UniverseLayout (rendering)', () => {
  it('puts the hero at the bottom left, the side column on the right, the bars under both', () => {
    const { container } = render(
      <div style={{ display: 'flex', width: '1024px', height: '700px' }}>
        <UniverseLayout
          hero={<section aria-label="Hero" className="h-20" />}
          side={<section aria-label="Social" className="h-full" />}
          banner={<section aria-label="Banner" className="h-12" />}
          actionBar={<section aria-label="Action bar" className="h-26" />}
        />
      </div>
    )
    const frame = container.firstElementChild!.getBoundingClientRect()
    const hero = region('Hero')
    const social = region('Social')
    const banner = region('Banner')
    const actionBar = region('Action bar')

    // The side column is 380px wide, its border and padding included; the hero sits at the
    // bottom of its frame
    expect(frame.right - social.left).toBe(380 - 1 - 24)
    expect(social.left).toBeGreaterThan(hero.right)
    expect(banner.top - hero.bottom).toBe(40)
    // Both bars span the whole width, the action bar at the very bottom
    expect(banner.width).toBe(1024)
    expect(actionBar.top).toBe(banner.bottom)
    expect(actionBar.bottom).toBe(frame.bottom)
  })

  it('lets a hero taller than its frame scroll to its top', () => {
    render(
      <div style={{ display: 'flex', width: '1024px', height: '300px' }}>
        <UniverseLayout
          hero={<section aria-label="Hero" style={{ height: '600px' }} />}
          side={<section aria-label="Social" />}
          actionBar={<section aria-label="Action bar" className="h-26" />}
        />
      </div>
    )
    const scroller = screen.getByRole('region', { name: 'Hero' }).parentElement!.parentElement!
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight)
    expect(region('Hero').top).toBeGreaterThanOrEqual(scroller.getBoundingClientRect().top)
  })

  it('fills the hero frame with the backdrop, without taking the clicks of the hero', () => {
    render(
      <div style={{ display: 'flex', width: '1024px', height: '700px' }}>
        <UniverseLayout
          hero={<button type="button">Open</button>}
          backdrop={<span data-testid="art" className="absolute inset-0" />}
          side={<section aria-label="Social" />}
          actionBar={<section aria-label="Action bar" className="h-26" />}
        />
      </div>
    )
    const art = box(screen.getByTestId('art'))
    const social = region('Social')
    const actionBar = region('Action bar')
    // The whole frame, padding included: from the window's left edge to the side column
    expect(art.left).toBe(actionBar.left)
    expect(art.top).toBe(social.top - 24)
    expect(art.bottom).toBe(actionBar.top)
    expect(art.right).toBe(social.left - 24 - 1)
    const open = screen.getByRole('button', { name: 'Open' }).getBoundingClientRect()
    expect(document.elementFromPoint(open.left + 2, open.top + 2)).toBe(
      screen.getByRole('button', { name: 'Open' })
    )
  })
})
