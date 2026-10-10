import { describe, expect, it } from 'vitest'
import { render } from '../../test/render'
import { Separator } from './separator'

describe('Separator', () => {
  it('renders a decorative line by default', () => {
    const { container } = render(<Separator />)
    expect(container.querySelector('[data-slot=separator]')).toBeInTheDocument()
  })
})
