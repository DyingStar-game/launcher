import { afterEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import type { ChangelogEntryRef } from '@shared/types/changelog'
import { act, render, screen } from '../../../test/render'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import ChangelogSidebar from './ChangelogSidebar'

describe('ChangelogSidebar', () => {
  it('shows a skeleton of versions while loading, not the empty message', async () => {
    act(() => useChangelogStore.setState({ loading: true, data: null, fetched: false }))
    render(<ChangelogSidebar />)
    expect(screen.queryByText('No release notes yet.')).not.toBeInTheDocument()
    expect(await screen.findByRole('status', { name: 'Loading content' })).toBeInTheDocument()
  })

  it('marks the versions not read yet as new', () => {
    const entry = (id: string, version: string): ChangelogEntryRef => ({
      id,
      env: 'universe',
      componentId: 'launcher',
      moduleKind: 'launcher',
      kind: 'release',
      version,
      date: null,
      yanked: false,
      devOf: null,
      devCount: 0
    })
    const saved = useChangelogStore.getState()
    act(() =>
      useChangelogStore.setState({
        loading: false,
        getEntries: () => [entry('a', '1.0.0'), entry('b', '0.9.0')],
        getCurrentId: () => 'b',
        isUnread: (id) => id === 'a',
        syncSelectionForEnv: vi.fn()
      })
    )
    render(<ChangelogSidebar />)
    expect(screen.getByRole('button', { name: /1\.0\.0.*New/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /0\.9\.0/ })).not.toHaveTextContent('New')
    act(() => useChangelogStore.setState(saved))
  })

  describe('dev releases (ADR 0042)', () => {
    const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }
    afterEach(() =>
      act(() => {
        useChangelogStore.setState(saved.changelog)
        useEnvStore.setState(saved.env)
      })
    )

    const dev = (version: string, devOf: string): ChangelogEntryRef => ({
      id: `env:DyingStar:${version}`,
      env: 'universe-testing',
      componentId: 'DyingStar',
      moduleKind: 'game',
      kind: 'release',
      version,
      date: '2026-10-14',
      yanked: false,
      devOf,
      devCount: 0
    })

    function show(env: 'universe' | 'universe-testing', entries: ChangelogEntryRef[]): void {
      act(() => {
        useEnvStore.setState({ activeEnv: env })
        useChangelogStore.setState({
          loading: false,
          data: null,
          getEntries: () => entries,
          getCurrentId: () => null,
          isUnread: (id) => id.endsWith('1530'),
          syncSelectionForEnv: vi.fn()
        })
      })
      render(<ChangelogSidebar />)
    }

    it('folds the builds of each version on Universe Testing, the newest open', async () => {
      show('universe-testing', [
        dev('0.2.0-dev.202611011530', '0.2.0'),
        dev('0.1.0-dev.202610141530', '0.1.0'),
        dev('0.1.0-dev.202610101200', '0.1.0')
      ])
      const newest = screen.getByRole('button', { name: /v0\.2\.0 · in progress/ })
      expect(newest).toHaveAttribute('aria-expanded', 'true')
      const older = screen.getByRole('button', { name: /v0\.1\.0 · in progress/ })
      expect(older).toHaveAttribute('aria-expanded', 'false')
      // One of its two builds unread
      expect(older).toHaveTextContent('1')
      expect(screen.getAllByRole('button', { name: /^\d{2}\/\d{2}\/\d{4} · / })).toHaveLength(1)
      await userEvent.click(older)
      expect(screen.getAllByRole('button', { name: /^\d{2}\/\d{2}\/\d{4} · / })).toHaveLength(3)
    })

    it('names a build by its short date, a dot when unread (ADR 0046)', () => {
      show('universe-testing', [
        dev('0.1.0-dev.202610141530', '0.1.0'),
        dev('0.1.0-dev.202610101200', '0.1.0')
      ])
      const builds = screen.getAllByRole('button', { name: /^\d{2}\/\d{2}\/\d{4} · / })
      expect(builds[0]).toHaveAccessibleName(/New$/)
      expect(builds[1]).not.toHaveAccessibleName(/New$/)
      expect(builds[0]).not.toHaveTextContent('Build')
    })

    it('folds the builds of a release under it on Universe', () => {
      show('universe', [
        { ...dev('0.1.0', '0.1.0'), devOf: null, devCount: 2 },
        dev('0.1.0-dev.202610141530', '0.1.0'),
        dev('0.1.0-dev.202610101200', '0.1.0')
      ])
      expect(screen.getByRole('button', { name: /v0\.1\.0/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /2 development builds/ })).toHaveAttribute(
        'aria-expanded',
        'false'
      )
    })
  })

  describe('mark all as read (ADR 0046)', () => {
    const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }
    afterEach(() =>
      act(() => {
        useChangelogStore.setState(saved.changelog)
        useEnvStore.setState(saved.env)
      })
    )

    function show(unread: number): ReturnType<typeof vi.fn> {
      const markAllViewed = vi.fn()
      act(() => {
        useEnvStore.setState({ activeEnv: 'universe-testing' })
        useChangelogStore.setState({
          loading: false,
          getEntries: () => [],
          unreadCount: () => unread,
          markAllViewed,
          syncSelectionForEnv: vi.fn()
        })
      })
      render(<ChangelogSidebar />)
      return markAllViewed
    }

    it('marks every version of the active universe as read', async () => {
      const markAllViewed = show(3)
      await userEvent.click(screen.getByRole('button', { name: 'Mark all as read' }))
      expect(markAllViewed).toHaveBeenCalledWith('universe-testing')
    })

    it('is not offered when everything is read', () => {
      show(0)
      expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument()
    })
  })
})
