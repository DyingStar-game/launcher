import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../test/render'
import { changelogFixture, item } from '../test/changelogFixture'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import ChangelogPage from './ChangelogPage'

const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }
afterEach(() =>
  act(() => {
    useChangelogStore.setState(saved.changelog, true)
    useEnvStore.setState(saved.env)
  })
)

const fixture = changelogFixture()
const data = changelogFixture({
  DyingStar: {
    ...fixture.components.DyingStar!,
    releases: [
      {
        version: '0.1.0-dev.202610151000',
        date: '2026-10-15',
        yanked: false,
        dev: true,
        url: null,
        entries: { en: [item('New ships', 'added', 'vehicles')], fr: [] }
      }
    ]
  }
})

describe('ChangelogPage (ADR 0051)', () => {
  it('shows what is new since the last visit, and moves the last seen date', async () => {
    vi.mocked(window.api.fetchChangelog).mockResolvedValue(data)
    act(() => {
      useEnvStore.setState({ activeEnv: 'universe-testing' })
      useChangelogStore.setState({
        lastSeenByEnv: { universe: null, 'universe-testing': 0 },
        shownMarkByEnv: {}
      })
    })
    render(<ChangelogPage />)
    expect(await screen.findByText('New since the last visit · 1 change')).toBeInTheDocument()
    expect(screen.getByText('New ships')).toBeInTheDocument()
    expect(useChangelogStore.getState().lastSeenByEnv['universe-testing']).toBe(
      Date.UTC(2026, 9, 15, 10)
    )
  })
})
