import { describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '../../test/render'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'

describe('Collapsible', () => {
  it('shows its content once the trigger is pressed', async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Builds</CollapsibleTrigger>
        <CollapsibleContent>Build 1</CollapsibleContent>
      </Collapsible>
    )
    const trigger = screen.getByRole('button', { name: 'Builds' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Build 1')).not.toBeInTheDocument()
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Build 1')).toBeInTheDocument()
  })
})
