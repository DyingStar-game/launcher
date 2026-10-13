import { describe, expect, it } from 'vitest'
import { act, render, screen } from '../../test/render'
import { toast } from 'sonner'
import { Toaster } from './sonner'

describe('Toaster', () => {
  it('shows a toast in the launcher look, outside the window drag region', async () => {
    render(<Toaster />)
    act(() => {
      toast.success('Cache cleared.')
    })
    const message = await screen.findByText('Cache cleared.')
    expect(message.closest('[data-sonner-toast]')).toHaveClass('app-no-drag', 'font-sans')
  })
})
