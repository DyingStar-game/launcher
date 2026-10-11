import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { render, screen } from '../../../test/render'
import Navbar from './Navbar'

const style = (el: Element): CSSStyleDeclaration => getComputedStyle(el)

afterEach(async () => {
  await page.viewport(1400, 900)
})

describe('Navbar (rendering)', () => {
  it('drags the window (the app-drag utility, ADR 0032)', () => {
    render(<Navbar />)
    expect(style(screen.getByRole('navigation')).getPropertyValue('-webkit-app-region')).toBe(
      'drag'
    )
  })

  it('keeps its outline buttons 36 px high and grey (shadcn variant mapping, ADR 0028)', () => {
    render(<Navbar />)
    for (const name of ['Open Discord', 'Minimize']) {
      const button = screen.getByRole('button', { name })
      expect(button.getBoundingClientRect().height).toBe(36)
      expect(style(button).color).toBe('rgb(107, 107, 128)')
      expect(style(button).cursor).toBe('pointer')
    }
  })

  it('moves the sections into the burger menu below 1400 px', async () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Lore' })).toBeVisible()
    await page.viewport(1200, 900)
    await expect.poll(() => screen.queryByRole('button', { name: 'Lore' })).toBeNull()
    expect(screen.getByRole('button', { name: 'More' })).toBeVisible()
  })
})
