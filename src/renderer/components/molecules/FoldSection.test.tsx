import { describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../test/render'
import FoldSection from './FoldSection'

const props = { heading: 'Tuesday', meta: '3 changes', summary: 'Vehicles, Audio' }

describe('FoldSection', () => {
  it('folded: its title, meta and summary, not its content', () => {
    render(
      <FoldSection {...props} open={false} onOpenChange={vi.fn()}>
        <p>Entry</p>
      </FoldSection>
    )
    expect(screen.getByRole('button', { name: /Tuesday.*3 changes.*Vehicles/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
    expect(screen.queryByText('Entry')).not.toBeInTheDocument()
  })

  it('open: its content, without the summary', () => {
    render(
      <FoldSection {...props} open onOpenChange={vi.fn()}>
        <p>Entry</p>
      </FoldSection>
    )
    expect(screen.getByText('Entry')).toBeInTheDocument()
    expect(screen.queryByText('Vehicles, Audio')).not.toBeInTheDocument()
  })

  it('asks to open on a click', async () => {
    const onOpenChange = vi.fn()
    render(
      <FoldSection {...props} open={false} onOpenChange={onOpenChange}>
        <p>Entry</p>
      </FoldSection>
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('points its chevron down when open', () => {
    const { rerender } = render(
      <FoldSection {...props} open={false} onOpenChange={vi.fn()}>
        <p>Entry</p>
      </FoldSection>
    )
    expect(screen.getByRole('button').querySelector('.lucide-chevron-right')).not.toBeNull()
    rerender(
      <FoldSection {...props} open onOpenChange={vi.fn()}>
        <p>Entry</p>
      </FoldSection>
    )
    expect(screen.getByRole('button').querySelector('.lucide-chevron-down')).not.toBeNull()
  })

  it('shows its aside, open or folded', () => {
    render(
      <FoldSection {...props} tone="apart" aside={<b>Soon</b>} open={false} onOpenChange={vi.fn()}>
        <p>Entry</p>
      </FoldSection>
    )
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })
})
