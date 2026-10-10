import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListSkeleton from './ListSkeleton'

describe('ListSkeleton', () => {
  it('announces loading content and draws the asked rows', () => {
    const { container } = render(<ListSkeleton rows={4} />)
    expect(screen.getByRole('status', { name: 'Loading content' })).toHaveAttribute(
      'aria-busy',
      'true'
    )
    expect(container.querySelectorAll('.size-8')).toHaveLength(4)
  })

  it('draws square avatars and an action block when asked', () => {
    const { container } = render(<ListSkeleton rows={1} avatar="square" action />)
    expect(container.querySelector('.size-8')).toHaveClass('rounded-xl')
    expect(container.querySelector('.w-16')).toBeInTheDocument()
  })
})
