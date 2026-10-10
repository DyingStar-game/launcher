import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import TextSkeleton from './TextSkeleton'

describe('TextSkeleton', () => {
  it('draws the lines, the last one shorter, hidden from assistive tech', () => {
    const { container } = render(<TextSkeleton lines={3} />)
    const lines = container.querySelectorAll('[data-slot="skeleton"]')
    expect(lines).toHaveLength(3)
    expect(lines[2]).toHaveClass('w-2/3')
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
