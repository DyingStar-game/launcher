import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal'

describe('Modal', () => {
  it('is a labelled dialog with its content', () => {
    render(
      <Modal title="Player profile" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>
    )
    expect(screen.getByRole('dialog', { name: 'Player profile' })).toBeInTheDocument()
    expect(screen.getByText('Body')).toBeInTheDocument()
  })

  it.each([
    [
      'the close button',
      async () => userEvent.click(screen.getByRole('button', { name: 'Close' }))
    ],
    ['Escape', async () => userEvent.keyboard('{Escape}')],
    ['a click outside', async () => userEvent.click(screen.getByRole('dialog'))]
  ])('closes on %s', async (_, act) => {
    const onClose = vi.fn()
    render(
      <Modal title="Sheet" onClose={onClose}>
        <p>Body</p>
      </Modal>
    )
    await act()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close on a click inside', async () => {
    const onClose = vi.fn()
    render(
      <Modal title="Sheet" onClose={onClose}>
        <p>Body</p>
      </Modal>
    )
    await userEvent.click(screen.getByText('Body'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
