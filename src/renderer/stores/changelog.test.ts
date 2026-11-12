import { afterEach, describe, expect, it } from 'vitest'
import type { GlobalChangelog } from '@shared/types/changelog'
import { changelogFixture, item } from '../test/changelogFixture'
import { useChangelogStore } from './changelog'

const saved = useChangelogStore.getState()
afterEach(() => useChangelogStore.setState(saved, true))

const fixture = changelogFixture()
const withBuilds = (...versions: string[]): GlobalChangelog =>
  changelogFixture({
    DyingStar: {
      ...fixture.components.DyingStar!,
      releases: versions.map((version) => ({
        version,
        date: '2026-10-14',
        yanked: false,
        dev: true,
        url: null,
        entries: { en: [item('Build')], fr: [] }
      }))
    }
  })

const OLD = '0.1.0-dev.202610141000'
const NEW = '0.1.0-dev.202610151000'
const NEW_TIME = Date.UTC(2026, 9, 15, 10)
const OLD_TIME = Date.UTC(2026, 9, 14, 10)

describe('changelog store (ADR 0051)', () => {
  it('starts a new player just before the newest publication', () => {
    useChangelogStore.getState().startReading(withBuilds(OLD, NEW))
    expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(OLD_TIME)
  })

  it('keeps the date of a known player', () => {
    useChangelogStore.setState({
      lastSeenByEnv: { universe: null, 'universe-testing': NEW_TIME }
    })
    useChangelogStore.getState().startReading(withBuilds(OLD, NEW))
    expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(NEW_TIME)
  })

  it('opening the feed sets the mark, once per launch, without seeing anything', () => {
    useChangelogStore.setState({
      lastSeenByEnv: { universe: null, 'universe-testing': OLD_TIME },
      seenTimesByEnv: { universe: [], 'universe-testing': [7] }
    })
    const { openFeed } = useChangelogStore.getState()
    openFeed('universe-testing', withBuilds(OLD, NEW))
    useChangelogStore.setState({
      seenTimesByEnv: { universe: [], 'universe-testing': [7, 8] }
    })
    openFeed('universe-testing', withBuilds(OLD, NEW))
    const state = useChangelogStore.getState()
    expect(state.lastSeenByEnv['universe-testing']).toBe(OLD_TIME)
    expect(state.shownMarkByEnv['universe-testing']).toEqual({ since: OLD_TIME, seen: [7] })
  })

  it('opened before its starting point is set, shows the newest publication as new', () => {
    useChangelogStore.getState().openFeed('universe-testing', withBuilds(OLD, NEW))
    expect(useChangelogStore.getState().shownMarkByEnv['universe-testing']?.since).toBe(OLD_TIME)
  })

  it('keeps what is seen until every publication is, then moves the date', () => {
    const LATER = '0.1.0-dev.202610161000'
    const LATER_TIME = Date.UTC(2026, 9, 16, 10)
    const data = withBuilds(OLD, NEW, LATER)
    useChangelogStore.setState({
      lastSeenByEnv: { universe: null, 'universe-testing': OLD_TIME }
    })
    const { markSeen } = useChangelogStore.getState()

    markSeen('universe-testing', [LATER_TIME, OLD_TIME], data)
    let state = useChangelogStore.getState()
    expect(state.lastSeenByEnv['universe-testing']).toBe(OLD_TIME)
    expect(state.seenTimesByEnv['universe-testing']).toEqual([LATER_TIME])

    markSeen('universe-testing', [NEW_TIME], data)
    state = useChangelogStore.getState()
    expect(state.lastSeenByEnv['universe-testing']).toBe(LATER_TIME)
    expect(state.seenTimesByEnv['universe-testing']).toEqual([])
  })

  it('marks everything as seen at once, the mark staying on screen', () => {
    useChangelogStore.setState({
      lastSeenByEnv: { universe: 5, 'universe-testing': OLD_TIME },
      seenTimesByEnv: { universe: [], 'universe-testing': [1] },
      shownMarkByEnv: { 'universe-testing': { since: OLD_TIME, seen: [] } }
    })
    useChangelogStore.getState().markAllSeen('universe-testing', withBuilds(OLD, NEW))
    const state = useChangelogStore.getState()
    expect(state.lastSeenByEnv).toEqual({ universe: 5, 'universe-testing': NEW_TIME })
    expect(state.seenTimesByEnv['universe-testing']).toEqual([])
    expect(state.shownMarkByEnv['universe-testing']).toEqual({ since: OLD_TIME, seen: [] })
  })

  it('leaves the other universe as it is', () => {
    useChangelogStore.setState({
      lastSeenByEnv: { universe: 5, 'universe-testing': OLD_TIME },
      shownMarkByEnv: {}
    })
    useChangelogStore.getState().openFeed('universe-testing', withBuilds(OLD, NEW))
    expect(useChangelogStore.getState().lastSeenByEnv.universe).toBe(5)
    expect(useChangelogStore.getState().shownMarkByEnv.universe).toBeUndefined()
  })

  it('marks nothing on an empty feed', () => {
    useChangelogStore.setState({ shownMarkByEnv: {} })
    useChangelogStore.getState().openFeed('universe', fixture)
    expect(useChangelogStore.getState().shownMarkByEnv).toEqual({})
  })
})
