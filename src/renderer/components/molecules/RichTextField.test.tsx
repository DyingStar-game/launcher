import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../test/render'
import userEvent from '@testing-library/user-event'
import RichTextField from './RichTextField'

const renderField = (value: string, onChange = vi.fn()): ReturnType<typeof vi.fn> => {
  render(<RichTextField label="Biography" value={value} onChange={onChange} maxLength={2000} />)
  return onChange
}

/** Selects the whole text, as Ctrl+A does. */
async function selectAll(): Promise<void> {
  await userEvent.click(screen.getByRole('textbox', { name: 'Biography' }))
  await userEvent.keyboard('{Control>}a{/Control}')
}

describe('RichTextField', () => {
  it('shows the BBCode as formatted text, named by its label', async () => {
    renderField('Pilot of the [b]Vel[/b][hr][color=red]Hi[/color]')
    const editor = screen.getByRole('textbox', { name: 'Biography' })
    expect(editor.querySelector('strong')).toHaveTextContent('Vel')
    expect(editor.querySelector('hr')).toBeInTheDocument()
    expect(editor.querySelector('span[style*="color"]')).toHaveTextContent('Hi')
    await waitFor(() => expect(editor).toHaveAccessibleDescription('48 / 2000'))
  })

  it('makes the selection bold, and shows the toggle pressed', async () => {
    const onChange = renderField('Vel')
    await selectAll()
    await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('[b]Vel[/b]'))
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('colours the selection with a colour the game reads', async () => {
    const onChange = renderField('Hi')
    await selectAll()
    await userEvent.click(screen.getByRole('button', { name: 'Colour' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Red' }))
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith('[color=red]Hi[/color]'))
  })

  it('inserts a horizontal rule', async () => {
    const onChange = renderField('a')
    await userEvent.click(screen.getByRole('textbox', { name: 'Biography' }))
    await userEvent.click(screen.getByRole('button', { name: 'Horizontal rule' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.stringContaining('[hr]')))
  })

  it('follows a value changed from outside (form reset)', async () => {
    const { rerender } = render(
      <RichTextField label="Biography" value="Old" onChange={vi.fn()} maxLength={2000} />
    )
    rerender(
      <RichTextField label="Biography" value="[i]New[/i]" onChange={vi.fn()} maxLength={2000} />
    )
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: 'Biography' }).querySelector('em')
      ).toHaveTextContent('New')
    )
  })

  it('shows its error and marks the editor invalid', async () => {
    render(
      <RichTextField
        label="Biography"
        value="x"
        onChange={vi.fn()}
        maxLength={2000}
        error="Too long"
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Too long')
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Biography' })).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    )
  })
})
