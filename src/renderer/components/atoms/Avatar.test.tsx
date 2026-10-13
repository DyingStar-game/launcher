import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import Avatar from './Avatar'

describe('Avatar', () => {
  it('shows the initial of the name', () => {
    render(<Avatar name="kira" />)
    expect(screen.getByText('k')).toBeInTheDocument()
    expect(screen.queryByTestId('presence-dot')).not.toBeInTheDocument()
  })

  it('shows a label instead of the initial', () => {
    render(<Avatar name="Nova Corp" label="NO" shape="square" />)
    expect(screen.getByText('NO')).toBeInTheDocument()
  })

  it('shows an icon instead of the initial', () => {
    render(<Avatar name="" icon={<svg data-testid="icon" />} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('shows a presence dot for a status', () => {
    render(<Avatar name="Kira" status="mission" />)
    expect(screen.getByTestId('presence-dot')).toHaveAttribute('data-status', 'mission')
  })
})
