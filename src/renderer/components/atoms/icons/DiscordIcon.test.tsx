import { describe, expect, it } from 'vitest'
import { render } from '../../../test/render'
import DiscordIcon from './DiscordIcon'

describe('DiscordIcon', () => {
  it('merges its size class with fill-current', () => {
    const { container } = render(<DiscordIcon className="size-5" />)
    expect(container.querySelector('svg')).toHaveClass('fill-current', 'size-5')
  })

  it('is decorative, with no native tooltip', () => {
    const { container } = render(<DiscordIcon />)
    expect(container.querySelector('title')).toBeNull()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
