import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../test/render'
import RenderErrorNotice from './RenderErrorNotice'

describe('RenderErrorNotice', () => {
  it('says the zone could not be displayed and retries on click', () => {
    const onRetry = vi.fn()
    render(<RenderErrorNotice onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This part of the launcher could not be displayed.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
