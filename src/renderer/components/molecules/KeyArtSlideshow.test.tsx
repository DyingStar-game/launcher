import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render } from '../../test/render'
import KeyArtSlideshow from './KeyArtSlideshow'

const shown = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('img')]
    .filter((img) => img.classList.contains('opacity-100'))
    .map((img) => img.getAttribute('src') ?? '')

afterEach(() => vi.useRealTimers())

describe('KeyArtSlideshow', () => {
  it('shows each image in turn, in a loop', () => {
    vi.useFakeTimers()
    const { container } = render(
      <KeyArtSlideshow images={['a.webp', 'b.webp']} intervalMs={1000} />
    )
    expect(shown(container)).toEqual(['a.webp'])
    act(() => vi.advanceTimersByTime(1000))
    expect(shown(container)).toEqual(['b.webp'])
    act(() => vi.advanceTimersByTime(1000))
    expect(shown(container)).toEqual(['a.webp'])
  })

  it('keeps a single image still, decorative', () => {
    vi.useFakeTimers()
    const { container } = render(<KeyArtSlideshow images={['a.webp']} intervalMs={1000} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(shown(container)).toEqual(['a.webp'])
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
