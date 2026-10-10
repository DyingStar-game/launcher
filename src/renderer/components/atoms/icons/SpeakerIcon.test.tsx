import { describe, expect, it } from 'vitest'
import { render } from '../../../test/render'
import SpeakerIcon from './SpeakerIcon'

describe('SpeakerIcon', () => {
  it('uses the default size, filled with the current colour', () => {
    const { container } = render(<SpeakerIcon />)
    expect(container.querySelector('svg')).toHaveClass('fill-current', 'w-4.5', 'h-4.5')
  })

  it('adds a slash when muted', () => {
    const { container, rerender } = render(<SpeakerIcon />)
    expect(container.querySelectorAll('path')).toHaveLength(1)
    rerender(<SpeakerIcon muted />)
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })
})
