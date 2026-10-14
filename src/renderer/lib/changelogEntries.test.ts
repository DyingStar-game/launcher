import { describe, expect, it } from 'vitest'
import { changelogFixture, item } from '../test/changelogFixture'
import type { ChangelogEntryRef } from '@shared/types/changelog'
import {
  buildChangelogEntryRefs,
  resolveChangelogGroups,
  unreleasedFingerprint
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
        yanked: false
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

describe('unreleasedFingerprint', () => {
  it('changes with the content only', () => {
    const entries = data.components.DyingStar!.unreleased.entries
    expect(unreleasedFingerprint(entries)).toBe(unreleasedFingerprint({ ...entries }))
    expect(unreleasedFingerprint(entries)).not.toBe(
      unreleasedFingerprint({ ...entries, en: entries.en.slice(1) })
    )
  })
})
