import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { act, render, screen } from '../../../test/render'
import i18n from '@i18n'
import { useAvailabilityStore } from '@stores/availability'
import { useAccountStore } from '@stores/account'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import UniverseBar from './UniverseBar'

/** The testing notice on screen: in the bar, or in its strip below the wide breakpoint. */
const visibleNotice = (): HTMLElement => {
  const shown = screen.getAllByText('Environnement de test').filter((el) => el.checkVisibility())
  expect(shown).toHaveLength(1)
  return shown[0]
}

afterEach(async () => {
  await i18n.changeLanguage('en')
  await page.viewport(1400, 900)
})

describe('UniverseBar (rendering)', () => {
  it('fits at 1024 px in French: testing notice, long name and unread versions', async () => {
    await page.viewport(1024, 900)
    await act(() => i18n.changeLanguage('fr'))
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
    render(<UniverseBar />)
    const [sections, , notice, account] = [...screen.getByRole('navigation').children].map((el) =>
      el.getBoundingClientRect()
    )
    const text = visibleNotice().getBoundingClientRect()
    expect(sections.right).toBeLessThanOrEqual(text.left)
    expect(text.right).toBeLessThanOrEqual(notice.right)
    expect(notice.right).toBeLessThanOrEqual(account.left)
    expect(account.right).toBeLessThanOrEqual(document.documentElement.clientWidth)
    expect(screen.getByText('bobthebuilder061490')).toBeVisible()
    // The account block is as high as a friend's row (48 px), inside the bar
    const bar = screen.getByRole('navigation').getBoundingClientRect()
    const block = screen.getByRole('button', { name: /Compte de/ }).getBoundingClientRect()
    expect(block.height).toBe(48)
    expect(block.top).toBeGreaterThan(bar.top)
    expect(block.bottom).toBeLessThan(bar.bottom)
  })

  it('fits at 1024 px in French, signed out: the sign-in block', async () => {
    await page.viewport(1024, 900)
    await act(() => i18n.changeLanguage('fr'))
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe-testing' })
      useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
      useAccountStore.setState((s) => ({
        data: { ...s.data, 'universe-testing': { status: 'disconnected' } }
      }))
    })
    render(<UniverseBar />)
    const signIn = screen.getByRole('button', { name: 'Se connecter avec Discord' })
    const text = visibleNotice().getBoundingClientRect()
    expect(text.right).toBeLessThanOrEqual(signIn.getBoundingClientRect().left)
    expect(signIn.getBoundingClientRect().right).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    )
    // Same block as once signed in
    expect(signIn.getBoundingClientRect().height).toBe(48)
  })
  it('folds the sections into one menu below 1024 px, keeps the account and moves the notice under the bar', async () => {
    await page.viewport(1000, 900)
    await act(() => i18n.changeLanguage('fr'))
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe-testing' })
      useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
      useAccountStore.setState((s) => ({
        data: { ...s.data, 'universe-testing': { status: 'disconnected' } }
      }))
    })
    render(<UniverseBar />)
    expect(screen.queryByRole('button', { name: 'Changelog' })).toBeNull()
    expect(screen.getByRole('button', { name: /Rubriques de l'univers/ })).toBeVisible()
    const signIn = screen.getByRole('button', { name: 'Se connecter avec Discord' })
    expect(signIn).toBeVisible()
    expect(signIn.getBoundingClientRect().right).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    )
    // The notice, whole, under the bar
    const bar = screen.getByRole('navigation').getBoundingClientRect()
    const notice = visibleNotice().parentElement!.getBoundingClientRect()
    expect(notice.top).toBeGreaterThanOrEqual(bar.bottom)
    const detail = visibleNotice().nextElementSibling as HTMLElement
    expect(detail).toBeVisible()
    expect(detail.scrollWidth).toBeLessThanOrEqual(detail.clientWidth)
  })
})
