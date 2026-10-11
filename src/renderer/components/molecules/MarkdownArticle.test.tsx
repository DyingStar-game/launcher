import { describe, expect, it } from 'vitest'
import { render, screen } from '../../test/render'
import MarkdownArticle from './MarkdownArticle'

describe('MarkdownArticle', () => {
  it('shows the title and the markdown, styled per element', () => {
    render(<MarkdownArticle title="The Fall" markdown={'## Origins\n\n> A quote\n\nSome `code`'} />)
    expect(screen.getByRole('heading', { level: 1, name: 'The Fall' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Origins' })).toHaveClass('font-bold')
    expect(screen.getByText('A quote').closest('blockquote')).toHaveClass('border-ds-accent')
    expect(screen.getByText('code')).toHaveClass('bg-ds-surface-hover')
  })

  it('sanitises raw HTML', () => {
    render(<MarkdownArticle title="T" markdown={'<p>Safe</p><script>alert(1)</script>'} />)
    expect(screen.getByText('Safe')).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })
})
