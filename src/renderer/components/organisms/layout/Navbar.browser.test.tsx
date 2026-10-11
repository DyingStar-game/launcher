import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { act, render, screen } from '../../../test/render'
import { useAvailabilityStore } from '@stores/availability'
import { useAccountStore } from '@stores/account'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
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
    for (const name of ['Community', 'Minimize']) {
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

  it('keeps sign-in and the window controls inside the bar at the narrowest window', async () => {
    await page.viewport(800, 900)
    act(() =>
      useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
    )
    render(<Navbar />)
    const width = document.documentElement.clientWidth
    for (const name of ['Sign in', 'Close']) {
      const button = screen.getByRole('button', { name })
      expect(button).toBeVisible()
      expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(width)
    }
  })

  it('fits at 1400 px, signed in with a long name and unread versions', async () => {
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe-testing' })
      useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
      useAccountStore.setState((s) => ({
        data: {
          ...s.data,
          'universe-testing': { status: 'connected', username: 'bobthebuilder061490' }
        }
      }))
      useChangelogStore.setState({ unreadCount: () => 2 })
    })
    render(<Navbar />)
    // The section links end before the right-hand groups begin
    const sections = screen.getByRole('button', { name: /Changelog/ }).parentElement!
    const right = screen.getByRole('navigation').lastElementChild!
    expect(sections.getBoundingClientRect().right).toBeLessThanOrEqual(
      right.getBoundingClientRect().left
    )
  })
})
