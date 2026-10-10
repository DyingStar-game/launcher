import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import RichTextToolbar from './RichTextToolbar'

const none = { bold: false, italic: false, underline: false, strike: false }

describe('RichTextToolbar', () => {
  it('toggles each mark and shows the active ones pressed', async () => {
    const onToggle = vi.fn()
    render(
      <RichTextToolbar
        active={{ ...none, italic: true }}
        onToggle={onToggle}
        onColor={vi.fn()}
        onRule={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'true')
    for (const [name, mark] of [
      ['Bold', 'bold'],
      ['Underline', 'underline'],
      ['Strikethrough', 'strike']
    ]) {
      await userEvent.click(screen.getByRole('button', { name }))
      expect(onToggle).toHaveBeenLastCalledWith(mark)
    }
  })

  it('picks a colour or the default one, and inserts a rule', async () => {
    const onColor = vi.fn()
    const onRule = vi.fn()
    render(<RichTextToolbar active={none} onToggle={vi.fn()} onColor={onColor} onRule={onRule} />)
    await userEvent.click(screen.getByRole('button', { name: 'Colour' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cyan' }))
    expect(onColor).toHaveBeenLastCalledWith('cyan')
    await userEvent.click(screen.getByRole('button', { name: 'Colour' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Default colour' }))
    expect(onColor).toHaveBeenLastCalledWith(null)
    await userEvent.click(screen.getByRole('button', { name: 'Horizontal rule' }))
    expect(onRule).toHaveBeenCalledOnce()
  })

  it('is a labelled toolbar that can be disabled', () => {
    render(
      <RichTextToolbar
        active={none}
        onToggle={vi.fn()}
        onColor={vi.fn()}
        onRule={vi.fn()}
        disabled
      />
    )
    expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bold' })).toBeDisabled()
  })
})
