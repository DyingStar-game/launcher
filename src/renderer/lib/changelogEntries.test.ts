import { describe, expect, it } from 'vitest'
import { changelogFixture, item } from '../test/changelogFixture'
import type { ChangelogEntryRef } from '@shared/types/changelog'
import type { ChangelogRelease } from '@shared/types/changelog'
import {
  buildChangelogEntryRefs,
  formatDevBuild,
  groupDevReleases,
  isReleased,
  resolveChangelogGroups,
  unreleasedFingerprint,
  versionCore
} from './changelogEntries'

const fixture = changelogFixture()

const data = changelogFixture({
  DyingStar: {
    ...fixture.components.DyingStar,
    unreleased: {
      url: null,
      entries: {
        en: [
          item('Older entry'),
          item('Hints moved', 'fixed', 'ui'),
          item('New dashboard\nspeed', 'added', 'vehicles'),
          item('Unknown area', 'added', 'retired-area')
        ],
        fr: [
          item('Ancienne entrée'),
          item('Bulles déplacées', 'fixed', 'ui'),
          item('Nouveau tableau de bord\nvitesse', 'added', 'vehicles'),
          item('Domaine inconnu', 'added', 'retired-area')
        ]
      }
    }
  },
  launcher: {
    ...fixture.components.launcher,
    unreleased: { url: null, entries: { en: [item('Not shown in testing')], fr: [] } },
    releases: [
      {
        version: '1.0.0',
        date: '2026-10-13',
        yanked: true,
        url: null,
        entries: { en: [item('Download resumes', 'fixed', 'download')], fr: [] }
      }
    ]
  }
})

const unreleasedRef = buildChangelogEntryRefs(data, 'universe-testing')[0] as ChangelogEntryRef
const releaseRef = buildChangelogEntryRefs(data, 'universe')[0] as ChangelogEntryRef

describe('buildChangelogEntryRefs', () => {
  it('lists the unreleased sections in testing, the launcher aside', () => {
    expect(buildChangelogEntryRefs(data, 'universe-testing')).toEqual([
      {
        id: 'universe-testing:DyingStar:unreleased',
        env: 'universe-testing',
        componentId: 'DyingStar',
        moduleKind: 'game',
        kind: 'unreleased',
        version: null,
        date: null,
        yanked: false,
        devOf: null,
        devCount: 0
      }
    ])
  })

  it('lists the releases in universe, withdrawn ones flagged', () => {
    expect(buildChangelogEntryRefs(data, 'universe')).toEqual([
      expect.objectContaining({ id: 'universe:launcher:1.0.0', version: '1.0.0', yanked: true })
    ])
  })
})

describe('resolveChangelogGroups', () => {
  it('groups the entries by type in the JSON order, older entries last, areas labelled', () => {
    expect(resolveChangelogGroups(data, unreleasedRef, 'fr')).toEqual([
      {
        type: 'added',
        label: 'Ajouts',
        entries: [
          { area: 'Véhicules', text: 'Nouveau tableau de bord\nvitesse' },
          // An area missing from the list shows as its key
          { area: 'retired-area', text: 'Domaine inconnu' }
        ]
      },
      {
        type: 'fixed',
        label: 'Corrections',
        entries: [{ area: 'Interface', text: 'Bulles déplacées' }]
      },
      { type: null, label: null, entries: [{ area: null, text: 'Ancienne entrée' }] }
    ])
  })

  it('falls back to the English entries when there are none in the language', () => {
    expect(resolveChangelogGroups(data, releaseRef, 'fr-FR')).toEqual([
      {
        type: 'fixed',
        label: 'Corrections',
        entries: [{ area: 'Téléchargement et installation', text: 'Download resumes' }]
      }
    ])
  })

  it('returns nothing for a version or component missing from the JSON', () => {
    expect(resolveChangelogGroups(data, { ...releaseRef, version: '9.9.9' }, 'en')).toEqual([])
    expect(resolveChangelogGroups(data, { ...releaseRef, componentId: 'gone' }, 'en')).toEqual([])
  })
})

/** A release of the fixture, a dev release when its version says so (ADR 0042). */
function release(version: string, date: string, en: string[]): ChangelogRelease {
  return {
    version,
    date,
    yanked: false,
    dev: version.includes('-dev.'),
    url: null,
    entries: { en: en.map((text) => item(text, 'added', 'ui')), fr: [] }
  }
}

const withDev = changelogFixture({
  DyingStar: {
    ...fixture.components.DyingStar,
    unreleased: { url: null, entries: { en: [item('Next build')], fr: [] } },
    releases: [
      release('0.2.0-dev.202611021200', '2026-11-02', ['Build B']),
      release('0.2.0-dev.202611011200', '2026-11-01', ['Build A']),
      // Nothing merged since the previous build: not listed
      release('0.2.0-dev.202611011100', '2026-11-01', []),
      release('0.1.0', '2026-10-31', []),
      release('0.1.0-dev.202610201530', '2026-10-20', ['Second']),
      release('0.1.0-dev.202610101530', '2026-10-10', ['First']),
      release('0.0.1-test5', '2025-12-16', ['Old'])
    ]
  }
})

describe('dev releases (ADR 0042)', () => {
  const ids = (env: 'universe' | 'universe-testing'): (string | null)[][] =>
    buildChangelogEntryRefs(withDev, env).map((r) => [r.version, r.devOf])

  it('lists the unreleased section then the dev releases by version in testing', () => {
    expect(ids('universe-testing')).toEqual([
      [null, null],
      ['0.2.0-dev.202611021200', '0.2.0'],
      ['0.2.0-dev.202611011200', '0.2.0'],
      ['0.1.0-dev.202610201530', '0.1.0'],
      ['0.1.0-dev.202610101530', '0.1.0']
    ])
  })

  it('lists each stable release followed by its dev releases in universe, unreleased ones aside', () => {
    expect(ids('universe')).toEqual([
      ['0.1.0', null],
      ['0.1.0-dev.202610201530', '0.1.0'],
      ['0.1.0-dev.202610101530', '0.1.0'],
      ['0.0.1-test5', null]
    ])
    expect(buildChangelogEntryRefs(withDev, 'universe')[0]).toMatchObject({ devCount: 2 })
  })

  it('gathers the entries of its dev releases in a stable release', () => {
    const [stable, newest] = buildChangelogEntryRefs(withDev, 'universe')
    const texts = (ref: ChangelogEntryRef | undefined): string[] =>
      resolveChangelogGroups(withDev, ref!, 'en').flatMap((g) => g.entries.map((e) => e.text))
    expect(texts(stable)).toEqual(['Second', 'First'])
    expect(texts(newest)).toEqual(['Second'])
  })

  it('folds the consecutive dev releases of a version', () => {
    const blocks = groupDevReleases(buildChangelogEntryRefs(withDev, 'universe-testing'))
    expect(
      blocks.map((b) => (b.kind === 'dev' ? `${b.version}×${b.entries.length}` : b.kind))
    ).toEqual(['entry', '0.2.0×2', '0.1.0×2'])
  })

  it('knows the released versions and the core of a version', () => {
    expect(isReleased(withDev, 'DyingStar', '0.1.0')).toBe(true)
    expect(isReleased(withDev, 'DyingStar', '0.2.0')).toBe(false)
    expect(versionCore('0.1.0-dev.202610141530')).toBe('0.1.0')
    expect(versionCore('1.2.3+build.4')).toBe('1.2.3')
  })

  it('reads the build time of a dev release, in UTC, shown in the locale', () => {
    const shown = new Date(Date.UTC(2026, 9, 14, 15, 30)).toLocaleString('en', {
      dateStyle: 'short',
      timeStyle: 'short'
    })
    expect(formatDevBuild('0.1.0-dev.202610141530', 'en')).toBe(shown)
    expect(formatDevBuild('0.1.0', 'en')).toBeNull()
  })
})

describe('unreleasedFingerprint', () => {
  it('changes with the content only', () => {
    const entries = data.components.DyingStar!.unreleased.entries
    expect(unreleasedFingerprint(entries)).toBe(unreleasedFingerprint({ ...entries }))
    expect(unreleasedFingerprint(entries)).not.toBe(
      unreleasedFingerprint({ ...entries, en: entries.en.slice(1) })
    )
  })
})
