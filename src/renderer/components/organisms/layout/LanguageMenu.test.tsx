import { afterEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from '@i18n'
import LanguageMenu from './LanguageMenu'

afterEach(async () => {
  await act(() => i18n.changeLanguage('en'))
})

describe('LanguageMenu', () => {
  it('lists the languages in the current one, the current marked', async () => {
    render(<LanguageMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Language' }))
    expect(screen.getByRole('menuitem', { name: 'English' })).toHaveAttribute(
      'aria-current',
      'true'
    )
    expect(screen.getByRole('menuitem', { name: 'French' })).not.toHaveAttribute('aria-current')
  })

  it('switches the language, then labels the list in it', async () => {
    render(<LanguageMenu />)
    await userEvent.click(screen.getByRole('button', { name: 'Language' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'French' }))
    expect(i18n.language).toBe('fr')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Langue' }))
    expect(screen.getByRole('menuitem', { name: 'Anglais' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Français' })).toHaveAttribute(
      'aria-current',
      'true'
    )
  })

  it('opens with the keyboard on the first language', async () => {
    render(<LanguageMenu />)
    screen.getByRole('button', { name: 'Language' }).focus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('menuitem', { name: 'English' })).toHaveFocus()
  })
})
