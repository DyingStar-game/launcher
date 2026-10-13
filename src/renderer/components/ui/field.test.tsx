import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'

describe('Field', () => {
  it('groups a label, a control, a help and an error', () => {
    render(
      <Field data-invalid>
        <FieldLabel htmlFor="f">Faction</FieldLabel>
        <input id="f" />
        <FieldDescription>Up to 64 characters</FieldDescription>
        <FieldError errors={[{ message: 'Too long' }, { message: 'Too long' }]} />
      </Field>
    )
    expect(screen.getByRole('group')).toHaveAttribute('data-slot', 'field')
    expect(screen.getByRole('textbox', { name: 'Faction' })).toBeInTheDocument()
    expect(screen.getByText('Up to 64 characters')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Too long')
  })

  it('shows no error box without errors', () => {
    render(<FieldError errors={[]} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
