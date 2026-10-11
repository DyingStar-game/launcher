import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { act, render, screen } from '../../../test/render'
import i18n from '@i18n'
import Navbar from './Navbar'

const style = (el: Element): CSSStyleDeclaration => getComputedStyle(el)

afterEach(async () => {
  vi.unstubAllEnvs()
  await i18n.changeLanguage('en')
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

  it('folds language, links and donate into the burger menu below 1024 px', async () => {
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Open Discord' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'More' })).toBeNull()
    await page.viewport(1000, 900)
    await expect.poll(() => screen.queryByRole('button', { name: 'Open Discord' })).toBeNull()
    expect(screen.getByRole('button', { name: 'More' })).toBeVisible()
  })

  it('keeps the window controls inside the bar at the narrowest window', async () => {
    await page.viewport(800, 900)
    render(<Navbar />)
    const close = screen.getByRole('button', { name: 'Close' })
    expect(close).toBeVisible()
    expect(close.getBoundingClientRect().right).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    )
  })

  it('fits at the minimum window width (1024 px), in French, without the burger', async () => {
    vi.stubEnv('VITE_NAV_DONATE_URL', 'https://donate.example')
    await page.viewport(1024, 900)
    await act(() => i18n.changeLanguage('fr'))
    render(<Navbar />)
    expect(screen.getByRole('button', { name: 'Faire un don' })).toBeVisible()
    const [left, right] = screen.getByRole('navigation').children
    expect(left.getBoundingClientRect().right).toBeLessThanOrEqual(
      right.getBoundingClientRect().left
    )
    expect(right.getBoundingClientRect().right).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    )
  })
})
