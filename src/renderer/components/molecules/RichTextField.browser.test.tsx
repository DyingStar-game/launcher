import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import RichTextField from './RichTextField'

describe('RichTextField (rendering)', () => {
  it('shows the placeholder in an empty text, muted', async () => {
    render(
      <RichTextField
        label="Biography"
        value=""
        onChange={vi.fn()}
        maxLength={2000}
        placeholder="Tell your story"
      />
    )
    const editor = screen.getByRole('textbox', { name: 'Biography' })
    await expect.poll(() => editor.querySelector('p.is-editor-empty')).not.toBeNull()
    const before = getComputedStyle(editor.querySelector('p')!, '::before')
    expect(before.content).toBe('"Tell your story"')
    expect(before.color).toBe('rgb(107, 107, 128)')
  })
})
