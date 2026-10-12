import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import InputField from './InputField'

describe('InputField (rendering)', () => {
  it('draws the field as high as its button, 36 px like every button', () => {
    render(
      <InputField
        label="Install folder"
        value="/games"
        onChange={() => {}}
        readOnly
        action={{ label: 'Browse', onClick: () => {} }}
      />
    )
    const field = screen.getByRole('textbox', { name: 'Install folder' }).getBoundingClientRect()
    const button = screen.getByRole('button', { name: 'Browse' }).getBoundingClientRect()
    expect(field.height).toBe(36)
    expect(button.height).toBe(field.height)
    expect(button.top).toBe(field.top)
  })
})
