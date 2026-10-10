import { describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '@components/atoms/Button'
import LabelTooltip from './LabelTooltip'

describe('LabelTooltip', () => {
  it('shows its label on hover', async () => {
    render(
      <LabelTooltip label="Minimise">
        <Button aria-label="Minimise">_</Button>
      </LabelTooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
    await userEvent.hover(screen.getByRole('button', { name: 'Minimise' }))
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Minimise')
  })

  it('shows its label on keyboard focus', async () => {
    render(
      <LabelTooltip label="Close">
        <Button aria-label="Close">×</Button>
      </LabelTooltip>
    )
    await userEvent.tab()
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Close')
  })

  it('stays closed when focus comes back without the keyboard (after a menu)', async () => {
    render(
      <LabelTooltip label="Language">
        <Button aria-label="Language">A</Button>
      </LabelTooltip>
    )
    const trigger = screen.getByRole('button', { name: 'Language' })
    // A programmatic focus after a mouse interaction is not :focus-visible
    vi.spyOn(trigger, 'matches').mockImplementation(
      (selector: string) =>
        selector !== ':focus-visible' && Element.prototype.matches.call(trigger, selector)
    )
    act(() => trigger.focus())
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('forgets the hover once the trigger is clicked (a menu then blocks the pointer)', async () => {
    render(
      <LabelTooltip label="Language">
        <Button aria-label="Language">A</Button>
      </LabelTooltip>
    )
    const trigger = screen.getByRole('button', { name: 'Language' })
    await userEvent.hover(trigger)
    await userEvent.click(trigger)
    vi.spyOn(trigger, 'matches').mockImplementation(
      (selector: string) =>
        selector !== ':focus-visible' && Element.prototype.matches.call(trigger, selector)
    )
    act(() => trigger.blur())
    act(() => trigger.focus())
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
