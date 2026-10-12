import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import userEvent from '@testing-library/user-event'
import LauncherUpdateBar from './LauncherUpdateBar'

describe('LauncherUpdateBar', () => {
  it('opens the download page of the new version', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    render(<LauncherUpdateBar version="1.4.0" downloadUrl="https://example/releases/1.4.0" />)
    expect(screen.getByRole('status')).toHaveTextContent('New launcher version available · 1.4.0')
    await userEvent.click(screen.getByRole('button', { name: 'Download' }))
    expect(open).toHaveBeenCalledWith('https://example/releases/1.4.0', '_blank')
    open.mockRestore()
  })

  it('only tells without a download page', () => {
    render(<LauncherUpdateBar version="1.4.0" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
