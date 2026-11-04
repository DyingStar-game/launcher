import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '../../test/render'
import ChangelogSection from './ChangelogSection'

const props = { heading: 'Tuesday', count: 2, groups: [], onOpenChange: vi.fn() }
const build = (
  version: string,
  yanked = false
): { componentId: string; moduleLabel: string; version: string; yanked: boolean } => ({
  componentId: 'DyingStar',
  moduleLabel: 'Dying Star',
  version,
  yanked
})

describe('ChangelogSection', () => {
  it('says how many changes it holds, and the date of a release', () => {
    render(<ChangelogSection {...props} date="3 November 2026" open={false} />)
    expect(
      screen.getByRole('button', { name: /Tuesday.*2 changes · 3 November 2026/ })
    ).toBeVisible()
  })

  it('names one build', () => {
    render(<ChangelogSection {...props} builds={[build('0.1.0-dev.1')]} open />)
    expect(screen.getByText('Build: Dying Star 0.1.0-dev.1')).toBeInTheDocument()
  })

  it('counts several builds, and tells which is withdrawn', () => {
    render(
      <ChangelogSection
        {...props}
        builds={[build('0.1.0-dev.2', true), build('0.1.0-dev.1')]}
        open
      />
    )
    expect(
      screen.getByText('2 builds: Dying Star 0.1.0-dev.2 (withdrawn) · Dying Star 0.1.0-dev.1')
    ).toBeInTheDocument()
  })

  it('shows no builds line for a release', () => {
    render(<ChangelogSection {...props} open />)
    expect(screen.queryByText(/build/i)).not.toBeInTheDocument()
  })

  it('marks a withdrawn release', () => {
    render(<ChangelogSection {...props} yanked open={false} />)
    expect(screen.getByText('Withdrawn')).toBeInTheDocument()
  })
})
