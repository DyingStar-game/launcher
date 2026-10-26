import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@i18n'
import type { ChangelogEntryRef } from '@shared/types/changelog'
import { act, render, screen } from '../../../test/render'
import { useChangelogStore } from '@stores/changelog'
import { useEnvStore } from '@stores/env'
import ChangelogSidebar from './ChangelogSidebar'

const saved = { changelog: useChangelogStore.getState(), env: useEnvStore.getState() }

afterEach(async () => {
  act(() => {
    useChangelogStore.setState(saved.changelog)
    useEnvStore.setState(saved.env)
  })
  await i18n.changeLanguage('en')
})

const build = (version: string): ChangelogEntryRef => ({
  id: `universe-testing:DyingStar:${version}`,
  env: 'universe-testing',
  componentId: 'DyingStar',
  moduleKind: 'game',
  kind: 'release',
  version,
  date: '2026-06-01',
  yanked: false,
  devOf: '0.1.0',
  devCount: 0
})

describe('ChangelogSidebar (rendering)', () => {
  it.each(['en', 'fr'])(
    'keeps each build and its group on one line, unread dot and count included (%s)',
    async (lng) => {
      await i18n.changeLanguage(lng)
      act(() => {
        useEnvStore.setState({ activeEnv: 'universe-testing' })
        useChangelogStore.setState({
          loading: false,
          data: null,
          // An afternoon build: the longest time in English ("12:00 PM")
          getEntries: () => [build('0.1.0-dev.202606010159'), build('0.1.0-dev.202612311200')],
          getCurrentId: () => null,
          isUnread: () => true,
          unreadCount: () => 2,
          syncSelectionForEnv: vi.fn()
        })
      })
      render(<ChangelogSidebar />)
      const builds = screen.getAllByRole('button', { name: / · \d/ })
      expect(builds).toHaveLength(2)
      // The group's trigger, with its count, is no higher than a build: one line each
      const trigger = screen.getByRole('button', { name: /v0\.1\.0/ })
      const rowHeight = builds[0].getBoundingClientRect().height
      expect(trigger.getBoundingClientRect().height).toBe(rowHeight)
      expect(builds[1].getBoundingClientRect().height).toBe(rowHeight)
      for (const row of builds) {
        const dot = row.querySelector('.rounded-full')!.getBoundingClientRect()
        expect(dot.right).toBeLessThanOrEqual(row.getBoundingClientRect().right)
        const name = row.querySelector('.whitespace-nowrap')!
        expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth + 1)
      }
    }
  )
})
