import { afterEach, describe, expect, it } from 'vitest'
import i18n from '@i18n'
import { act, render, screen } from '../../../test/render'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import AccountMenu from './AccountMenu'

const saved = useAccountStore.getState()

const savedAvailability = useAvailabilityStore.getState()

afterEach(async () => {
  act(() => {
    useAccountStore.setState(saved, true)
    useAvailabilityStore.setState(savedAvailability, true)
  })
  await i18n.changeLanguage('en')
})

describe('AccountMenu (rendering)', () => {
  it('spins the sign-in indicator around the centre of the avatar', () => {
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe' })
      useAvailabilityStore.setState({ available: { universe: true, 'universe-testing': true } })
      useAccountStore.setState((s) => ({ data: { ...s.data, universe: { status: 'loading' } } }))
    })
    render(<AccountMenu />)
    const svg = screen.getByRole('button', { name: 'Cancel sign-in' }).querySelector('svg')!
    const spinner = svg.parentElement!
    const avatar = spinner.closest('.rounded-full')!
    const centre = (r: DOMRect): [number, number] => [r.left + r.width / 2, r.top + r.height / 2]
    const [x, y] = centre(spinner.getBoundingClientRect())
    const [ax, ay] = centre(avatar.getBoundingClientRect())
    expect(Math.abs(x - ax)).toBeLessThan(0.5)
    expect(Math.abs(y - ay)).toBeLessThan(0.5)
  })

  it.each(['en', 'fr'])(
    'shows the whole "sign-in unavailable" heading, not truncated (%s)',
    async (lng) => {
      await i18n.changeLanguage(lng)
      act(() => {
        useEnvStore.setState({ activeEnv: 'universe' })
        useAvailabilityStore.setState({
          available: { universe: true, 'universe-testing': true },
          authAvailable: { universe: false, 'universe-testing': true }
        })
      })
      render(<AccountMenu />)
      const heading = screen.getByText(i18n.t('navbar.account.authDownShort'))
      expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth)
    }
  )
})
