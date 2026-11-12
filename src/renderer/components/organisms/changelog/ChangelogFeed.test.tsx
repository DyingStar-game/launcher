import { afterEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { ChangelogRelease, GlobalChangelog } from '@shared/types/changelog'
import { act, render, screen, waitFor } from '../../../test/render'
import { changelogFixture, item } from '../../../test/changelogFixture'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import ChangelogFeed from './ChangelogFeed'

const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }
afterEach(() =>
  act(() => {
    useChangelogStore.setState(saved.changelog, true)
    useEnvStore.setState(saved.env)
  })
)

const dev = (stamp: string, text: string): ChangelogRelease => ({
  version: `0.1.0-dev.${stamp}`,
  date: '2026-10-01',
  yanked: false,
  dev: true,
  url: null,
  entries: { en: [item(text, 'added', 'vehicles')], fr: [] }
})

const fixture = changelogFixture()
/** One build per day, the 1st of the month at noon the oldest. */
const days = (count: number): ChangelogRelease[] =>
  Array.from({ length: count }, (_, i) =>
    dev(`202610${String(i + 1).padStart(2, '0')}1200`, `Day ${i + 1}`)
  )
const dataOf = (releases: ChangelogRelease[]): GlobalChangelog =>
  changelogFixture({
    DyingStar: {
      ...fixture.components.DyingStar!,
      unreleased: { url: null, entries: { en: [item('Next thing')], fr: [] } },
      releases
    },
    horizonserver: {
      repo: 'DyingStar-game/horizonserver',
      areas: {},
      unreleased: { url: null, entries: { en: [], fr: [] } },
      releases: [dev('202610021300', 'Mesh change')]
    }
  })

/** What main answers, and where the mark sits. */
const seed = (data: GlobalChangelog | null, since = Infinity): void => {
  vi.mocked(window.api.fetchChangelog).mockResolvedValue(data)
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe-testing' })
    useChangelogStore.setState({
      lastSeenByEnv: { universe: null, 'universe-testing': since === Infinity ? null : since },
      seenTimesByEnv: { universe: [], 'universe-testing': [] },
      shownMarkByEnv: { 'universe-testing': { since, seen: [] } }
    })
  })
}

/** Renders the feed, once the changelog is read. */
const renderFeed = async (): Promise<void> => {
  render(<ChangelogFeed />)
  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
}

const SINCE_DAY_3 = Date.UTC(2026, 9, 3, 13)

describe('ChangelogFeed (ADR 0051)', () => {
  it('shows a skeleton while loading, not the unavailable message', async () => {
    vi.mocked(window.api.fetchChangelog).mockReturnValue(new Promise(() => {}))
    render(<ChangelogFeed />)
    expect(screen.queryByText(/not available/)).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })

  it('says when the changelog is unavailable', async () => {
    seed(null)
    await renderFeed()
    expect(screen.getByText(/not available/)).toBeInTheDocument()
  })

  it('says when there is nothing to show', async () => {
    seed(fixture)
    act(() => useEnvStore.setState({ activeEnv: 'universe' }))
    await renderFeed()
    expect(screen.getByText('No release notes yet.')).toBeInTheDocument()
  })

  it('marks what is new, opening the 3 newest sections with something new', async () => {
    seed(dataOf(days(7)), SINCE_DAY_3)
    await renderFeed()
    expect(screen.getByText('New since the last visit · 4 changes')).toBeInTheDocument()
    expect(screen.getByText('Already seen')).toBeInTheDocument()
    for (const open of ['Day 7', 'Day 6', 'Day 5']) {
      expect(screen.getByText(open)).toBeInTheDocument()
    }
    expect(screen.queryByText('Day 4')).not.toBeInTheDocument()
  })

  it('opens the newest section when nothing is new, without any mark', async () => {
    seed(dataOf(days(3)))
    await renderFeed()
    expect(screen.queryByText(/New since/)).not.toBeInTheDocument()
    expect(screen.queryByText('Already seen')).not.toBeInTheDocument()
    expect(screen.getByText('Day 3')).toBeInTheDocument()
    expect(screen.queryByText('Day 1')).not.toBeInTheDocument()
  })

  it('keeps what comes next folded and apart, never counted as new', async () => {
    seed(dataOf(days(1)))
    await renderFeed()
    expect(screen.queryByText('Next thing')).not.toBeInTheDocument()
    expect(screen.getByText('Not in the game yet')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Coming in the next build/ }))
    expect(screen.getByText('Next thing')).toBeInTheDocument()
  })

  it('filters by module, and tags every module under "All" only', async () => {
    seed(dataOf(days(2)), 0)
    await renderFeed()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    const badge = '[data-slot="badge"]'
    expect(screen.getByText('Horizon Server', { selector: badge })).toBeInTheDocument()
    expect(screen.getAllByText('Dying Star', { selector: badge }).length).toBeGreaterThan(0)

    await userEvent.click(screen.getByRole('button', { name: /^Horizon Server/ }))
    expect(screen.getByRole('button', { name: /^Horizon Server/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.queryByText('Day 2')).not.toBeInTheDocument()
    expect(screen.getByText('Mesh change')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).not.toHaveTextContent('Horizon Server')
  })

  it('counts what is new per module, what is open being seen', async () => {
    // 6 entries, the 3 newest days open: 3 left to see
    seed(dataOf(days(5)), 0)
    await renderFeed()
    expect(screen.getByRole('button', { name: /^All.*3 new changes/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Dying Star.*2 new changes/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Horizon Server.*1 new change/ })
    ).toBeInTheDocument()
  })

  it('counts down as days open, the date moving once all are seen', async () => {
    seed(dataOf(days(5)), 0)
    await renderFeed()
    await userEvent.click(screen.getByRole('button', { name: /October 2.*2 changes/ }))
    expect(screen.getByRole('button', { name: /^All.*1 new change/ })).toBeInTheDocument()
    expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(0)

    await userEvent.click(screen.getByRole('button', { name: /October 1.*1 change/ }))
    expect(screen.getByRole('button', { name: /^All/ })).not.toHaveTextContent('new')
    expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(
      Date.UTC(2026, 9, 5, 12)
    )
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
    // The mark stays for this launch
    expect(screen.getByText('New since the last visit · 6 changes')).toBeInTheDocument()
  })

  it('marks everything as read at once, the mark staying', async () => {
    seed(dataOf(days(5)), 0)
    await renderFeed()
    await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
    expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(
      Date.UTC(2026, 9, 5, 12)
    )
    expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled()
    expect(screen.getByText('New since the last visit · 6 changes')).toBeInTheDocument()
  })

  it('names the builds of a day', async () => {
    seed(dataOf(days(2)))
    await renderFeed()
    expect(
      screen.getByText(
        '2 builds: Dying Star 0.1.0-dev.202610021200 · Horizon Server 0.1.0-dev.202610021300'
      )
    ).toBeInTheDocument()
  })

  it('lists 10 older sections, then shows the others on demand', async () => {
    seed(dataOf(days(12)))
    await renderFeed()
    await userEvent.click(screen.getByRole('button', { name: 'Show older (2)' }))
    expect(screen.queryByRole('button', { name: /Show older/ })).not.toBeInTheDocument()
  })

  it('keeps a section folded by the player when filters change', async () => {
    seed(dataOf(days(2)))
    await renderFeed()
    expect(screen.getByText('Day 2')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /2 changes/ }))
    expect(screen.queryByText('Day 2')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^Dying Star/ }))
    expect(screen.queryByText('Day 2')).not.toBeInTheDocument()
  })

  it('shows stable releases on Universe, with no builds line', async () => {
    const data = changelogFixture({
      launcher: {
        ...fixture.components.launcher!,
        releases: [
          {
            version: '1.1.0',
            date: '2026-10-24',
            yanked: true,
            dev: false,
            url: null,
            entries: { en: [item('In place update', 'added', 'download')], fr: [] }
          }
        ]
      }
    })
    seed(data)
    act(() => useEnvStore.setState({ activeEnv: 'universe' }))
    await renderFeed()
    expect(screen.getByRole('button', { name: /Launcher v1\.1\.0/ })).toBeInTheDocument()
    expect(screen.getByText('Withdrawn')).toBeInTheDocument()
    expect(screen.getByText('In place update')).toBeInTheDocument()
    expect(screen.queryByText(/^Build/)).not.toBeInTheDocument()
  })
})
