import { describe, expect, it } from 'vitest'
import type { ChangelogFeedItem, ChangelogRelease, GlobalChangelog } from '@shared/types/changelog'
import { changelogFixture, item } from '../test/changelogFixture'
import {
  buildChangelogFeed,
  changelogFeedModules,
  countNewItems,
  filterChangelogFeed,
  formatFeedDay,
  groupChangelogItems,
  initialLastSeen,
  newestPublication,
  NOTHING_NEW,
  topAreas,
  versionCore
} from './changelogEntries'

const release = (
  version: string,
  text: string,
  over: Partial<ChangelogRelease> = {}
): ChangelogRelease =>
  ({
    version,
    date: '2026-10-14',
    yanked: false,
    dev: version.includes('-dev.'),
    url: null,
    entries: { en: [item(text, 'added', 'vehicles')], fr: [] },
    ...over
  }) as ChangelogRelease

const base = changelogFixture()
const data: GlobalChangelog = changelogFixture({
  DyingStar: {
    ...base.components.DyingStar!,
    unreleased: { url: null, entries: { en: [item('Next')], fr: [item('Prochain')] } },
    releases: [
      release('0.1.0-dev.202610141000', 'Morning build'),
      release('0.1.0-dev.202610141800', 'Evening build'),
      release('0.1.0-dev.202610101000', 'Older build'),
      release('0.1.0', 'Stable', { date: '2026-10-20' })
    ]
  },
  horizonserver: {
    repo: 'DyingStar-game/horizonserver',
    areas: {},
    unreleased: { url: null, entries: { en: [], fr: [] } },
    releases: [release('0.1.0-dev.202610141200', 'Mesh build')]
  },
  launcher: {
    ...base.components.launcher!,
    unreleased: { url: null, entries: { en: [item('Launcher next')], fr: [] } },
    releases: [release('1.1.0', 'Launcher stable', { date: '2026-10-25' })]
  }
})

describe('versionCore', () => {
  it('drops the pre-release part', () => {
    expect(versionCore('0.1.0-dev.202610141530')).toBe('0.1.0')
    expect(versionCore('1.1.0')).toBe('1.1.0')
  })
})

describe('buildChangelogFeed on Universe Testing (ADR 0051)', () => {
  const feed = buildChangelogFeed(data, 'universe-testing', 'en')

  it('gathers the builds of a day across modules, newest day first', () => {
    expect(feed.sections.map((s) => s.items.map((i) => i.text))).toEqual([
      ['Evening build', 'Morning build', 'Mesh build'],
      ['Older build']
    ])
  })

  it('lists the builds of a day', () => {
    const [day] = feed.sections
    expect(day?.kind === 'day' && day.builds.map((b) => b.version)).toEqual([
      '0.1.0-dev.202610141800',
      '0.1.0-dev.202610141000',
      '0.1.0-dev.202610141200'
    ])
  })

  it('keeps the launcher and stable releases out', () => {
    const texts = feed.sections.flatMap((s) => s.items.map((i) => i.text))
    expect(texts).not.toContain('Stable')
    expect(texts).not.toContain('Launcher stable')
    expect(feed.upcoming.map((i) => i.text)).toEqual(['Next'])
  })

  it('reads a build time as UTC, an entry knowing its build', () => {
    const [day] = feed.sections
    expect(day?.items[0]?.publishedAt).toBe(Date.UTC(2026, 9, 14, 18, 0))
    expect(day?.items[0]?.build).toBe('0.1.0-dev.202610141800')
  })

  it('resolves the area label and the reader language, English when missing', () => {
    expect(feed.sections[0]?.items[0]?.area).toBe('Vehicles')
    const fr = buildChangelogFeed(data, 'universe-testing', 'fr-FR')
    expect(fr.sections[0]?.items[0]).toMatchObject({ area: 'Véhicules', text: 'Evening build' })
    expect(fr.upcoming[0]?.text).toBe('Prochain')
  })

  it('leaves out a build without text', () => {
    const empty = changelogFixture({
      DyingStar: {
        ...base.components.DyingStar!,
        releases: [
          release('0.1.0-dev.202610141000', 'x', { entries: { en: [item('  ')], fr: [] } })
        ]
      }
    })
    expect(buildChangelogFeed(empty, 'universe-testing', 'en').sections).toEqual([])
  })
})

describe('buildChangelogFeed on Universe (ADR 0051)', () => {
  const feed = buildChangelogFeed(data, 'universe', 'en')

  it('lists the stable releases of every module, newest first, nothing upcoming', () => {
    expect(feed.upcoming).toEqual([])
    expect(feed.sections.map((s) => s.id)).toEqual(['launcher:1.1.0', 'DyingStar:0.1.0'])
  })

  it('gathers the dev releases under their stable release', () => {
    const stable = feed.sections[1]
    expect(stable?.items.map((i) => i.text)).toEqual([
      'Stable',
      'Evening build',
      'Morning build',
      'Older build'
    ])
    expect(stable?.items[1]?.build).toBe('0.1.0-dev.202610141800')
  })

  it('does not list a version not released yet', () => {
    const notYet = changelogFixture({
      DyingStar: {
        ...base.components.DyingStar!,
        releases: [release('0.2.0-dev.202610141000', 'Dev only')]
      }
    })
    expect(buildChangelogFeed(notYet, 'universe', 'en').sections).toEqual([])
  })
})

describe('filterChangelogFeed', () => {
  const feed = buildChangelogFeed(data, 'universe-testing', 'en')

  it('returns the feed as is without a module', () => {
    expect(filterChangelogFeed(feed, null)).toBe(feed)
  })

  it('keeps one module, its builds, and drops the emptied sections', () => {
    const { sections, upcoming } = filterChangelogFeed(feed, 'horizonserver')
    expect(upcoming).toEqual([])
    expect(sections).toHaveLength(1)
    expect(sections[0]?.items.map((i) => i.text)).toEqual(['Mesh build'])
    expect(sections[0]?.kind === 'day' && sections[0].builds).toHaveLength(1)
  })
})

describe('changelogFeedModules', () => {
  it('lists the modules with something to show, the game first', () => {
    expect(changelogFeedModules(buildChangelogFeed(data, 'universe-testing', 'en'))).toEqual([
      'DyingStar',
      'horizonserver'
    ])
  })
})

describe('reading state helpers', () => {
  const feed = buildChangelogFeed(data, 'universe-testing', 'en')

  it('counts what came out after a date, never what comes next', () => {
    const since = Date.UTC(2026, 9, 14, 11, 0)
    expect(countNewItems(feed.sections, { since, seen: [] })).toBe(2)
    expect(countNewItems(feed.sections, NOTHING_NEW)).toBe(0)
  })

  it('leaves out the publications already seen', () => {
    const since = Date.UTC(2026, 9, 14, 11, 0)
    const seen = [Date.UTC(2026, 9, 14, 18, 0)]
    expect(countNewItems(feed.sections, { since, seen })).toBe(1)
  })

  it('gives the newest publication', () => {
    expect(newestPublication(feed)).toBe(Date.UTC(2026, 9, 14, 18, 0))
    expect(newestPublication({ upcoming: [], sections: [] })).toBeNull()
  })

  it('starts a new player just before the newest publication', () => {
    const start = initialLastSeen(feed)
    expect(start).toBe(Date.UTC(2026, 9, 14, 12, 0))
    expect(countNewItems(feed.sections, { since: start!, seen: [] })).toBe(1)
    expect(initialLastSeen({ upcoming: [], sections: [] })).toBeNull()
  })

  it('counts the only publication as new', () => {
    const one = changelogFixture({
      DyingStar: {
        ...base.components.DyingStar!,
        releases: [release('0.1.0-dev.202610141000', 'Only')]
      }
    })
    const only = buildChangelogFeed(one, 'universe-testing', 'en')
    expect(countNewItems(only.sections, { since: initialLastSeen(only)!, seen: [] })).toBe(1)
  })
})

describe('topAreas', () => {
  const entry = (area: string | null): ChangelogFeedItem => ({
    componentId: 'DyingStar',
    type: null,
    area,
    text: 'x',
    publishedAt: 1,
    build: null
  })

  it('gives the most frequent areas and how many others, skipping entries without one', () => {
    const items = ['A', 'B', 'B', 'C', 'C', 'C', 'D', null].map(entry)
    expect(topAreas(items)).toEqual({ names: ['C', 'B', 'A'], others: 1 })
  })
})

describe('groupChangelogItems', () => {
  it('follows the order of the types, the entries without a type last', () => {
    const entry = (type: string | null): ChangelogFeedItem => ({
      componentId: 'DyingStar',
      type,
      area: null,
      text: 'x',
      publishedAt: 1,
      build: null
    })
    const groups = groupChangelogItems(data, ['fixed', null, 'added'].map(entry), 'fr')
    expect(groups.map((g) => g.label)).toEqual(['Ajouts', 'Corrections', null])
  })
})

describe('formatFeedDay', () => {
  const time = new Date(2026, 10, 3, 12).getTime()

  it('capitalises the day, the year only when not the current one', () => {
    expect(formatFeedDay(time, 'fr-FR', new Date(2026, 11, 1).getTime())).toBe('Mardi 3 novembre')
    expect(formatFeedDay(time, 'fr-FR', new Date(2027, 0, 1).getTime())).toBe(
      'Mardi 3 novembre 2026'
    )
  })
})
