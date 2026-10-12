import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import UniverseHeading from './UniverseHeading'

describe('UniverseHeading', () => {
  it('shows the universe and its installed version', () => {
    render(<UniverseHeading name="Universe" version="20261010203221" releaseDate="10/10/2026" />)
    expect(screen.getByRole('heading', { level: 1, name: 'Universe' })).toBeInTheDocument()
    expect(screen.getByText('Version 20261010203221')).toBeInTheDocument()
    expect(screen.getByText('Release 10/10/2026')).toBeInTheDocument()
  })

  it('shows the tagline under the name', () => {
    render(<UniverseHeading name="Universe Testing" tagline="Public test server" />)
    expect(screen.getByText('Public test server')).toBeInTheDocument()
  })

  it('shows only the name while the game is not installed', () => {
    render(<UniverseHeading name="Universe" />)
    expect(screen.queryByText(/Version/)).not.toBeInTheDocument()
  })
})
