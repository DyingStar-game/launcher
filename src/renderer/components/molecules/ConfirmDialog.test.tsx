import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../../test/render'
import userEvent from '@testing-library/user-event'
import { SocialStoreError } from '@lib/socialErrors'
import Button from '@components/atoms/Button'
import ConfirmDialog from './ConfirmDialog'

const renderDialog = (onConfirm: () => Promise<unknown>, confirmDisabled = false): void => {
  render(
    <ConfirmDialog
      trigger={<Button>Leave</Button>}
      title="Leave Nova?"
      description="You will lose your rank."
      confirmLabel="Leave Nova"
      onConfirm={onConfirm}
      confirmDisabled={confirmDisabled}
    />
  )
}

describe('ConfirmDialog', () => {
  it('asks first, then runs the action and closes', async () => {
    const onConfirm = vi.fn(() => Promise.resolve())
    renderDialog(onConfirm)
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(await screen.findByRole('alertdialog', { name: 'Leave Nova?' })).toBeInTheDocument()
    expect(onConfirm).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Leave Nova' }))
    expect(onConfirm).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('cancels without acting', async () => {
    const onConfirm = vi.fn(() => Promise.resolve())
    renderDialog(onConfirm)
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }))
    expect(onConfirm).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('stays open and explains a refusal', async () => {
    renderDialog(() => Promise.reject(new SocialStoreError('forbidden')))
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Leave Nova' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your rank no longer allows this action.'
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  it('keeps the confirm button disabled when asked', async () => {
    renderDialog(vi.fn(), true)
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    expect(await screen.findByRole('button', { name: 'Leave Nova' })).toBeDisabled()
  })

  it('gives Cancel and the confirm button the same size', async () => {
    renderDialog(vi.fn())
    await userEvent.click(screen.getByRole('button', { name: 'Leave' }))
    const cancel = await screen.findByRole('button', { name: 'Cancel' })
    const confirm = screen.getByRole('button', { name: 'Leave Nova' })
    expect(cancel).toHaveClass('h-9')
    expect(confirm).toHaveClass('h-9')
  })
})
