import { afterEach, describe, expect, it } from 'vitest'
import { changelogFixture, item } from '../test/changelogFixture'
import { useChangelogStore } from './changelog'

const saved = useChangelogStore.getState()
afterEach(() => useChangelogStore.setState(saved))

const fixture = changelogFixture()
const data = changelogFixture({
  DyingStar: {
    ...fixture.components.DyingStar,
    releases: [
      {
        version: '0.1.0',
        date: '2026-10-31',
        yanked: false,
        dev: false,
        url: null,
        entries: { en: [item('Stable')], fr: [] }
      },
      {
        version: '0.1.0-dev.202610141530',
        date: '2026-10-14',
        yanked: false,
        dev: true,
        url: null,
        entries: { en: [item('Build')], fr: [] }
      }
    ]
  }
})

describe('changelog store', () => {
  it('counts a dev release as unread on Universe Testing only (ADR 0042)', () => {
    useChangelogStore.setState({ data, viewedIds: [] })
    const { isUnread, unreadCount } = useChangelogStore.getState()
    expect(isUnread('universe-testing:DyingStar:0.1.0-dev.202610141530')).toBe(true)
    expect(isUnread('universe:DyingStar:0.1.0-dev.202610141530')).toBe(false)
    expect(isUnread('universe:DyingStar:0.1.0')).toBe(true)
    expect(unreadCount('universe')).toBe(1)
    expect(unreadCount('universe-testing')).toBe(1)
  })

  it('marks every version of one universe as read, the other left as it is (ADR 0046)', () => {
    const withNews = changelogFixture({
      DyingStar: {
        ...data.components.DyingStar!,
        unreleased: { url: null, entries: { en: [item('Next')], fr: [] } }
      }
    })
    useChangelogStore.setState({ data: withNews, viewedIds: [], unreleasedSeenFingerprint: {} })
    expect(useChangelogStore.getState().unreadCount('universe-testing')).toBe(2)

    useChangelogStore.getState().markAllViewed('universe-testing')
    const { unreadCount, isUnread } = useChangelogStore.getState()
    expect(unreadCount('universe-testing')).toBe(0)
    expect(isUnread('universe-testing:DyingStar:unreleased')).toBe(false)
    expect(unreadCount('universe')).toBe(1)
  })
})
