import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { DetailHeaderSkeleton, StatsSkeleton } from './DetailSkeleton'

describe('DetailSkeleton', () => {
  it('draws a header announced as loading, with the asked avatar shape', () => {
    const { container } = render(<DetailHeaderSkeleton avatar="square" />)
    expect(screen.getByRole('status', { name: 'Loading content' })).toBeInTheDocument()
    expect(container.querySelector('.size-14')).toHaveClass('rounded-xl')
  })

  it('draws three stat cards', () => {
    const { container } = render(<StatsSkeleton />)
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3)
  })
})
