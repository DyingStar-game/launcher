import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import DiscordIcon from './DiscordIcon'

describe('DiscordIcon', () => {
  it('merges its size class with fill-current', () => {
    const { container } = render(<DiscordIcon className="w-5 h-5" title="Discord" />)
    expect(container.querySelector('svg')).toHaveClass('fill-current', 'w-5', 'h-5')
  })
})
