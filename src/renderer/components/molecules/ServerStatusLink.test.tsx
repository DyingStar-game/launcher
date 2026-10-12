import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import ServerStatusLink from './ServerStatusLink'

describe('ServerStatusLink', () => {
  it('opens the status page, with the players online', () => {
    render(<ServerStatusLink status="online" players={2} href="https://status.example" />)
    expect(screen.getByRole('link', { name: 'Available' })).toHaveAttribute(
      'href',
      'https://status.example'
    )
    expect(screen.getByText('2 players online')).toBeInTheDocument()
  })

  it('says "player" for a single one', () => {
    render(<ServerStatusLink status="online" players={1} />)
    expect(screen.getByText('1 player online')).toBeInTheDocument()
  })

  it('is plain text without a status page', () => {
    render(<ServerStatusLink status="maintenance" players={0} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Under maintenance')).toBeInTheDocument()
  })

  it('does not count players while the server does not answer', () => {
    render(<ServerStatusLink status="offline" players={5} />)
    expect(screen.getByText('— players')).toBeInTheDocument()
  })
})
