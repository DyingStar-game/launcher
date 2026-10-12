import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '../../../test/render'
import userEvent from '@testing-library/user-event'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import { useVersionStore } from '@stores/version'
import { useChangelogStore } from '@stores/changelog'
import { useNavigationStore } from '@stores/navigation'
import GameHero from './GameHero'

const saved = {
  files: useFilesStore.getState(),
  version: useVersionStore.getState(),
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
    useVersionStore.setState((s) => ({
      latestGameVersions: {
        ...s.latestGameVersions,
        universe: { version: latest, releaseDate: null }
      }
    }))
    useChangelogStore.setState({
      data: {
        generated_at: '',
        components: {
          DyingStar: {
            unreleased: { en: [], fr: [] },
            releases: [
              { version: '0.4.3', date: '2026-10-10', entries: { en: ['New ships'], fr: [] } }
            ]
          }
        }
      }
    })
  })
}

beforeEach(() => act(() => useNavigationStore.setState({ currentView: 'universe' })))

afterEach(() =>
  act(() => {
    useFilesStore.setState(saved.files, true)
    useVersionStore.setState(saved.version, true)
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
