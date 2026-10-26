import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import { useChangelogStore } from '@stores/changelog'
import { useNavigationStore } from '@stores/navigation'
import { changelogFixture, item } from '../../../test/changelogFixture'
import GameHero from './GameHero'

// The latest version is a query with its own tests: here it answers what each test sets
const versions = vi.hoisted(() => ({
  latest: { version: null as string | null, releaseDate: null as string | null }
}))
vi.mock('@hooks/version/useLatestGameVersion', () => ({
  useLatestGameVersion: () => versions.latest
}))

const saved = {
  files: useFilesStore.getState(),
  changelog: useChangelogStore.getState()
}

/** The Universe game, installed at `version`, with `latest` online. */
function seed(version: string, latest: string): void {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe' })
    const { data } = useFilesStore.getState()
    useFilesStore.setState({
      data: {
        ...data,
        universe: { ...data.universe, installed: true, version, releaseDate: '2026-10-01' }
      }
    })
    versions.latest = { version: latest, releaseDate: null }
    const fixture = changelogFixture()
    useChangelogStore.setState({
      data: changelogFixture({
        DyingStar: {
          ...fixture.components.DyingStar,
          releases: [
            {
              version: '0.4.3',
              date: '2026-10-10',
              yanked: false,
              url: null,
              entries: { en: [item('New ships', 'added', 'vehicles')], fr: [] }
            }
          ]
        }
      })
    })
  })
}

beforeEach(() => act(() => useNavigationStore.setState({ currentView: 'universe' })))

afterEach(() =>
  act(() => {
    useFilesStore.setState(saved.files, true)
    useChangelogStore.setState(saved.changelog, true)
  })
)

describe('GameHero', () => {
  it('shows the universe and the installed version', () => {
    seed('20261001000000', '20261001000000')
    render(<GameHero />)
    expect(screen.getByRole('heading', { level: 1, name: 'Universe' })).toBeInTheDocument()
    expect(screen.getByText('Version 20261001000000')).toBeInTheDocument()
    expect(screen.getByText('Release 01/10/2026')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'New game version available' })
    ).not.toBeInTheDocument()
    // The tagline is the testing universe's only
    expect(screen.queryByText(/Public test server/)).not.toBeInTheDocument()
  })

  it('tells the testing universe is a public test server', () => {
    act(() => useEnvStore.setState({ activeEnv: 'universe-testing' }))
    render(<GameHero />)
    expect(screen.getByText('Public test server · progress is not kept')).toBeInTheDocument()
  })

  it('tells a new version is out, and opens its changelog entry', async () => {
    seed('20261001000000', '20261010000000')
    render(<GameHero />)
    expect(screen.getByRole('heading', { name: 'New game version available' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'See the full changelog' }))
    expect(useNavigationStore.getState().currentView).toBe('changelog')
    expect(useChangelogStore.getState().currentByEnv.universe).toBe('universe:DyingStar:0.4.3')
  })
})
