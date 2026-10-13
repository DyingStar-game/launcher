import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle
} from './alert-dialog'

describe('AlertDialog', () => {
  it('renders a labelled alert dialog that the frameless window lets the player click', () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogTitle>Disband?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>
    )
    const dialog = screen.getByRole('alertdialog', { name: 'Disband?' })
    expect(dialog).toHaveClass('app-no-drag')
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.')
  })
})
