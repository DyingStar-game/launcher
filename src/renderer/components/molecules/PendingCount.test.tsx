import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import PendingCount from './PendingCount'

describe('PendingCount', () => {
  it('shows the count and reads it as a sentence', () => {
    render(
      <button type="button">
        Friends <PendingCount count={2} />
      </button>
    )
    expect(screen.getByRole('button', { name: /Friends.*2 requests waiting/ })).toBeInTheDocument()
  })

  it('reads another sentence when given one', () => {
    render(
      <button type="button">
        Changelog <PendingCount count={3} label="3 new versions" />
      </button>
    )
    expect(screen.getByRole('button', { name: /Changelog.*3 new versions/ })).toBeInTheDocument()
  })

  it('shows nothing when no request waits', () => {
    const { container } = render(<PendingCount count={0} />)
    expect(container).toBeEmptyDOMElement()
  })
})
