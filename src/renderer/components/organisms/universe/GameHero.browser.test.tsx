import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '../../../test/render'
import { useEnvStore } from '@stores/env'
import { useFilesStore } from '@stores/files'
import GameHero from './GameHero'

// The latest version is a query with its own tests: here it answers what each test sets
const versions = vi.hoisted(() => ({
  latest: { version: null as string | null, releaseDate: null as string | null }
}))
vi.mock('@hooks/version/useLatestGameVersion', () => ({
  useLatestGameVersion: () => versions.latest
}))

const saved = { files: useFilesStore.getState() }

afterEach(() =>
  act(() => {
    useFilesStore.setState(saved.files, true)
  })
)

/** The hero laid out as on the home page: at the bottom of its frame. */
function renderHero(): void {
  render(
    <div style={{ display: 'flex', flexDirection: 'column', width: '800px', height: '600px' }}>
      <div className="mt-auto flex flex-col gap-5">
        <GameHero />
      </div>
    </div>
  )
}

/** The Universe build `20261001000000` installed, with `latest` online. */
function seed(latest: string): void {
  act(() => {
    useEnvStore.setState({ activeEnv: 'universe' })
    useFilesStore.setState((s) => ({
      data: {
        ...s.data,
        universe: { ...s.data.universe, installed: true, version: '20261001000000' }
      }
    }))
    versions.latest = { version: latest, releaseDate: '2026-10-12' }
  })
}

const name = (): DOMRect => screen.getByRole('heading', { level: 1 }).getBoundingClientRect()

describe('GameHero (rendering)', () => {
  it('shows the update card above the name, which stays where it was', () => {
    seed('20261001000000')
    renderHero()
    const without = name()

    seed('20261012000000')
    const card = screen.getByRole('heading', { name: 'New game version available' })
    expect(name().top).toBe(without.top)
    expect(card.getBoundingClientRect().bottom).toBeLessThan(name().top)
  })
})
