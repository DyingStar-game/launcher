import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen, within } from '../../../test/render'
import { changelogFixture, item } from '../../../test/changelogFixture'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import type { ChangelogItem } from '@shared/types/changelog'
import ChangelogContent from './ChangelogContent'

const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }
afterEach(() =>
  act(() => {
    useChangelogStore.setState(saved.changelog)
    useEnvStore.setState(saved.env)
  })
)

const fixture = changelogFixture()

/** Shows the launcher's 1.0.0 in Universe, with these English entries. */
function showRelease(en: ChangelogItem[], yanked = false): void {
  const data = changelogFixture({
    launcher: {
      ...fixture.components.launcher,
      releases: [
        { version: '1.0.0', date: '2026-10-13', yanked, url: null, entries: { en, fr: [] } }
      ]
    }
  })
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe' })
    useChangelogStore.setState({
      data,
      loading: false,
      fetched: true,
      currentByEnv: { universe: 'universe:launcher:1.0.0', 'universe-testing': null }
    })
  })
  render(<ChangelogContent />)
}

describe('ChangelogContent', () => {
  it('shows a skeleton of an entry while the changelog loads', async () => {
    act(() => useChangelogStore.setState({ loading: true, data: null, fetched: false }))
    render(<ChangelogContent />)
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })

  it('says when the changelog is unavailable', () => {
    act(() => useChangelogStore.setState({ loading: false, data: null, fetched: true }))
    render(<ChangelogContent />)
    expect(screen.getByText(/unavailable|not available/i)).toBeInTheDocument()
  })

  it('groups the entries under their type, each starting with its area', () => {
    showRelease([
      item('Download resumes', 'fixed', 'download'),
      item('Older entry'),
      item('Pause button', 'added', 'download')
    ])
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(headings).toEqual(['Added', 'Fixed', 'Other changes'])
    const fixed = screen.getByRole('heading', { name: 'Fixed' }).closest('section') as HTMLElement
    expect(within(fixed).getByRole('listitem')).toHaveTextContent(
      'Download and install: Download resumes'
    )
    expect(within(fixed).getByText('Download and install').tagName).toBe('STRONG')
  })

  it('shows no type heading when a version only has older entries', () => {
    showRelease([item('Older entry')])
    expect(screen.getByRole('listitem')).toHaveTextContent('Older entry')
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('flags a withdrawn version', () => {
    showRelease([item('Older entry')], true)
    expect(screen.getByText('Withdrawn')).toBeInTheDocument()
  })

  describe('dev releases (ADR 0042)', () => {
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
            entries: { en: [], fr: [] }
          },
          {
            version: '0.1.0-dev.202610141530',
            date: '2026-10-14',
            yanked: false,
            dev: true,
            url: null,
            entries: { en: [item('New dashboard', 'added', 'vehicles')], fr: [] }
          }
        ]
      }
    })

    function show(id: string): void {
      act(() => {
        useEnvStore.setState({ activeEnv: 'universe' })
        useChangelogStore.setState({
          data,
          loading: false,
          fetched: true,
          currentByEnv: { universe: id, 'universe-testing': null }
        })
      })
      render(<ChangelogContent />)
    }

    it('titles a dev release by its build time, its version underneath', () => {
      show('universe:DyingStar:0.1.0-dev.202610141530')
      expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Dying Star — Build /)
      expect(screen.getByText('0.1.0-dev.202610141530')).toBeInTheDocument()
    })

    it('shows the entries of its dev releases in a stable release', () => {
      show('universe:DyingStar:0.1.0')
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dying Star — v0.1.0')
      expect(screen.getByText('Includes 1 development build.')).toBeInTheDocument()
      expect(screen.getByRole('listitem')).toHaveTextContent('Vehicles: New dashboard')
    })
  })
})
