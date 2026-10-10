import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'

describe('Tooltip', () => {
  it('shows non-draggable content', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger>Hover</TooltipTrigger>
          <TooltipContent>Hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByRole('tooltip')).toHaveTextContent('Hint')
    expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveClass('app-no-drag')
  })
})
