import { describe, expect, it } from 'vitest'
import { useChangelogStore } from './changelog'

// jsdom: the store's persistence needs a localStorage

describe('changelog store persistence (ADR 0051)', () => {
  const options = useChangelogStore.persist.getOptions()

  const nothingSeen = {
    lastSeenByEnv: { universe: null, 'universe-testing': null },
    seenTimesByEnv: { universe: [], 'universe-testing': [] }
  }

  it('keeps what was seen, not the mark of this launch', () => {
    useChangelogStore.setState({
      lastSeenByEnv: { universe: 1, 'universe-testing': 2 },
      seenTimesByEnv: { universe: [], 'universe-testing': [3] },
      shownMarkByEnv: { universe: { since: 1, seen: [] } }
    })
    expect(options.partialize?.(useChangelogStore.getState())).toEqual({
      lastSeenByEnv: { universe: 1, 'universe-testing': 2 },
      seenTimesByEnv: { universe: [], 'universe-testing': [3] }
    })
  })

  it('drops the read state per version of an older launcher', async () => {
    const migrated = await options.migrate?.(
      { viewedIds: ['a'], unreleasedSeenFingerprint: { k: 'f' } },
      2
    )
    expect(migrated).toEqual(nothingSeen)
  })
})
