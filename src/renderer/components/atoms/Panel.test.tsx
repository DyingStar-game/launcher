import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import Panel from './Panel'

describe('Panel', () => {
  it('draws a framed panel, scrolling inside', () => {
    render(<Panel data-testid="panel">Content</Panel>)
    const panel = screen.getByTestId('panel')
    expect(panel.tagName).toBe('DIV')
    expect(panel).toHaveClass(
      'bg-ds-surface',
      'rounded-ds-panel',
      'shadow-ds-panel',
      'overflow-y-auto'
    )
  })

  it('draws a card without the panel hover', () => {
    render(
      <Panel variant="card" data-testid="card">
        Figure
      </Panel>
    )
    const card = screen.getByTestId('card')
    expect(card).toHaveClass('shadow-ds-card')
    expect(card).not.toHaveClass('hover:border-ds-accent/40')
  })

  it('lets the layout class win over its own', () => {
    render(
      <Panel className="overflow-hidden p-7" data-testid="panel">
        Content
      </Panel>
    )
    const panel = screen.getByTestId('panel')
    expect(panel).toHaveClass('overflow-hidden', 'p-7')
    expect(panel).not.toHaveClass('overflow-y-auto')
  })

  it('draws itself on its child', () => {
    render(
      <Panel variant="card" asChild>
        <form aria-label="Create" />
      </Panel>
    )
    expect(screen.getByRole('form', { name: 'Create' })).toHaveClass('shadow-ds-card')
  })
})
