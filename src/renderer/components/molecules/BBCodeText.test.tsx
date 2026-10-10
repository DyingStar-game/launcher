import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import BBCodeText from './BBCodeText'

describe('BBCodeText', () => {
  it('renders bold and coloured text instead of the tags', () => {
    const { container } = render(
      <BBCodeText text="[b]Salut[/b], c'est [color=#F8C3CD]Frank Leboeuf[/color]" />
    )
    expect(container).toHaveTextContent("Salut, c'est Frank Leboeuf")
    expect(screen.getByText('Salut').tagName).toBe('STRONG')
    expect(screen.getByText('Frank Leboeuf')).toHaveStyle({ color: '#F8C3CD' })
  })

  it('draws a rule and keeps unknown tags as typed', () => {
    const { container } = render(<BBCodeText text={'a[hr]b [url]x[/url]'} />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(container).toHaveTextContent('ab [url]x[/url]')
  })

  it('injects no HTML', () => {
    const { container } = render(<BBCodeText text="<img src=x onerror=alert(1)>" />)
    expect(container.querySelector('img')).toBeNull()
    expect(container).toHaveTextContent('<img src=x onerror=alert(1)>')
  })
})
