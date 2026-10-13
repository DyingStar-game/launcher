import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import InputField from './InputField'

describe('InputField', () => {
  it('reports typed text', async () => {
    const onChange = vi.fn()
    render(<InputField label="Ticker" value="" onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'N')
    expect(onChange).toHaveBeenCalledWith('N')
  })

  it('runs its action button', async () => {
    const onClick = vi.fn()
    render(
      <InputField
        label="Folder"
        value=""
        onChange={vi.fn()}
        action={{ label: 'Browse', onClick }}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: 'Browse' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables the action with the field', () => {
    render(
      <InputField
        label="Folder"
        value=""
        onChange={vi.fn()}
        disabled
        action={{ label: 'Browse', onClick: vi.fn() }}
      />
    )
    expect(screen.getByRole('button', { name: 'Browse' })).toBeDisabled()
  })

  it('shows a spinner in its action while it runs', () => {
    render(
      <InputField
        label="Ticker"
        value="NOVA"
        onChange={vi.fn()}
        action={{ label: 'Create', onClick: vi.fn(), loading: true }}
      />
    )
    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('aria-busy', 'true')
  })

  it('is named by its label', () => {
    render(<InputField label="Ticker" value="" onChange={vi.fn()} />)
    expect(screen.getByRole('textbox', { name: 'Ticker' })).toBeInTheDocument()
  })

  it('shows its error and marks the input invalid', () => {
    render(<InputField label="Ticker" value="N" onChange={vi.fn()} error="Too short" />)
    const input = screen.getByRole('textbox', { name: 'Ticker' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Too short')
  })
})
