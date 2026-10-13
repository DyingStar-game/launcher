import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import TabButton from './TabButton'

describe('TabButton', () => {
  it('calls onClick', async () => {
    const onClick = vi.fn()
    render(<TabButton onClick={onClick}>Social</TabButton>)
    await userEvent.click(screen.getByRole('button', { name: 'Social' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('highlights the selected segment like a selected tab, filling its frame', () => {
    render(
      <TabButton tone="segment" selected>
        Universe
      </TabButton>
    )
    const tab = screen.getByRole('button', { name: 'Universe' })
    expect(tab).toHaveClass('bg-white/10', 'text-ds-text', 'h-full')
    expect(tab).toHaveAttribute('aria-current', 'true')
  })

  it('highlights the selected neutral tab, mutes the others', () => {
    render(
      <>
        <TabButton selected>Social</TabButton>
        <TabButton>Changelog</TabButton>
      </>
    )
    expect(screen.getByRole('button', { name: 'Social' })).toHaveClass('bg-white/10')
    expect(screen.getByRole('button', { name: 'Changelog' })).toHaveClass('text-ds-muted')
    expect(screen.getByRole('button', { name: 'Changelog' })).not.toHaveAttribute('aria-current')
  })
})
