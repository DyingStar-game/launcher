import { describe, expect, it } from 'vitest'
import { changelogFixture, item } from '../test/changelogFixture'
import { useChangelogStore } from './changelog'

// jsdom: the store's persistence needs a localStorage

const fixture = changelogFixture()
const data = changelogFixture({
  DyingStar: {
    ...fixture.components.DyingStar,
    releases: [
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

describe('changelog store persistence', () => {
  it('opens on the newest version at each launch: the version shown is not kept (ADR 0046)', async () => {
    const { persist } = useChangelogStore
    const options = persist.getOptions()
    useChangelogStore.setState({
      viewedIds: ['a'],
      currentByEnv: { universe: null, 'universe-testing': 'universe-testing:DyingStar:old' }
    })
    expect(options.partialize?.(useChangelogStore.getState())).toEqual({
      viewedIds: ['a'],
      unreleasedSeenFingerprint: {}
    })

    // A version kept by an older launcher is forgotten, the read state stays
    const migrated = await options.migrate?.(
      {
        viewedIds: ['a'],
        unreleasedSeenFingerprint: { k: 'f' },
        currentByEnv: { universe: null, 'universe-testing': 'universe-testing:DyingStar:old' }
      },
      1
    )
    expect(migrated).toEqual({ viewedIds: ['a'], unreleasedSeenFingerprint: { k: 'f' } })

    useChangelogStore.setState({ data, currentByEnv: { universe: null, 'universe-testing': null } })
    useChangelogStore.getState().syncSelectionForEnv('universe-testing')
    expect(useChangelogStore.getState().getCurrentId('universe-testing')).toBe(
      'universe-testing:DyingStar:0.1.0-dev.202610141530'
    )
  })
})
