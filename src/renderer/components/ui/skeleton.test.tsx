import { describe, expect, it } from 'vitest'
import { render } from '../../test/render'
import { Skeleton } from './skeleton'

describe('Skeleton', () => {
  it('pulses, hidden from assistive tech, with its shape', () => {
    const { container } = render(<Skeleton shape="circle" className="size-8" />)
    const block = container.firstChild
    expect(block).toHaveClass('animate-pulse', 'rounded-full', 'size-8')
    expect(block).toHaveAttribute('aria-hidden', 'true')
  })

  it('is a rounded block by default', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('rounded-lg')
  })
})
