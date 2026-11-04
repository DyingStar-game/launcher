import { afterEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { act, render, screen } from '../../../test/render'
import { changelogFixture, item } from '../../../test/changelogFixture'
import i18n from '@i18n'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import ChangelogFeed from './ChangelogFeed'

const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }
afterEach(async () => {
  act(() => {
    useChangelogStore.setState(saved.changelog, true)
    useEnvStore.setState(saved.env)
  })
  await i18n.changeLanguage('en')
  await page.viewport(1400, 900)
})

const fixture = changelogFixture()
const areas = ['ui', 'vehicles', 'audio', 'player', 'server'].map((area) =>
  item(`A change about ${area}, long enough to need more than one word.`, 'added', area)
)
const data = changelogFixture({
  DyingStar: {
    ...fixture.components.DyingStar!,
    unreleased: { url: null, entries: { en: [item('Next')], fr: [item('Prochain')] } },
    releases: ['01', '02'].map((day) => ({
      version: `0.1.0-dev.202610${day}1200`,
      date: `2026-10-${day}`,
      yanked: false,
      dev: true,
      url: null,
      entries: { en: areas, fr: areas }
    }))
  },
  horizonserver: {
    repo: 'DyingStar-game/horizonserver',
    areas: {},
    unreleased: { url: null, entries: { en: [], fr: [] } },
    releases: [
      {
        version: '0.1.0-dev.202610021300',
        date: '2026-10-02',
        yanked: false,
        dev: true,
        url: null,
        entries: {
          en: [item('Faster mesh with a rather long sentence to fill the line up to its end.')],
          fr: []
        }
      }
    ]
  }
})

describe('ChangelogFeed (rendering)', () => {
  it('fits the minimum window in French, each folded section on one line', async () => {
    await page.viewport(1024, 900)
    await act(() => i18n.changeLanguage('fr'))
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe-testing' })
      useChangelogStore.setState({
        shownMarkByEnv: { 'universe-testing': { since: Infinity, seen: [] } }
      })
    })
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(data)
    render(<ChangelogFeed />)
    await screen.findByRole('button', { name: /Jeudi 1 octobre/i })

    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth)

    const upcoming = screen.getByRole('button', { name: /À venir/ })
    const folded = screen.getByRole('button', { name: /Jeudi 1 octobre/i })
    // One line: as high as the other folded line, whatever its content
    expect(folded.getBoundingClientRect().height).toBe(upcoming.getBoundingClientRect().height)
    expect(folded.getBoundingClientRect().height).toBeLessThan(60)
  })
})
