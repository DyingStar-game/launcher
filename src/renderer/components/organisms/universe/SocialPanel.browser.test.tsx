import { describe, expect, it } from 'vitest'
import { render, screen } from '../../../test/render'
import { seedSocial } from '../../../test/seedSocial'
import SocialPanel from './SocialPanel'

describe('SocialPanel (rendering)', () => {
  it('scrolls a long friend list, keeping "See all" in view under it', async () => {
    seedSocial({
      friends: Array.from({ length: 40 }, (_, i) => ({
        id: `p${i}`,
        name: `Pilot ${i + 1}`,
        status: 'offline' as const
      }))
    })
    render(
      <div style={{ display: 'flex', flexDirection: 'column', height: '500px' }}>
        <SocialPanel />
      </div>
    )
    const last = await screen.findByRole('button', { name: 'Open the profile of Pilot 40' })
    const list = last.closest('.overflow-y-auto')!
    expect(list.scrollHeight).toBeGreaterThan(list.clientHeight)
    const seeAll = screen.getByRole('button', { name: /See all/ }).getBoundingClientRect()
    expect(seeAll.bottom).toBeLessThanOrEqual(500)
    expect(seeAll.top).toBeGreaterThanOrEqual(list.getBoundingClientRect().bottom)
  })
})
