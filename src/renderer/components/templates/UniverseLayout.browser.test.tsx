import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import UniverseLayout from './UniverseLayout'

const box = (name: string): DOMRect => screen.getByRole('region', { name }).getBoundingClientRect()

describe('UniverseLayout (rendering)', () => {
  it('stacks two panels on the left and gives the side panel the whole height', () => {
    render(
      <div style={{ display: 'flex', height: '800px' }}>
        <UniverseLayout
          panels={[
            <section key="game" aria-label="Game" className="h-full" />,
            <section key="files" aria-label="Files" className="h-full" />
          ]}
          side={<section aria-label="Social" className="h-full" />}
        />
      </div>
    )
    const game = box('Game')
    const files = box('Files')
    const social = box('Social')
    expect(files.top).toBeGreaterThan(game.bottom)
    expect(files.left).toBe(game.left)
    expect(social.left).toBeGreaterThan(game.right)
    expect(social.top).toBe(game.top)
    expect(social.bottom).toBe(files.bottom)
  })
})
