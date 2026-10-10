import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BackButton from './BackButton'

describe('BackButton', () => {
  it('goes back', async () => {
    const onBack = vi.fn()
    render(<BackButton onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /Back/ }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
