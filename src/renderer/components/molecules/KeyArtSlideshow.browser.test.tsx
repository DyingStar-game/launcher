import { describe, expect, it } from 'vitest'
import { render } from '../../test/render'
import { KEY_ART } from '@lib/keyArt'
import KeyArtSlideshow from './KeyArtSlideshow'

describe('KeyArtSlideshow (rendering)', () => {
  it('fills its frame, whatever its proportions, without stretching the image', async () => {
    const { container } = render(
      <div data-testid="frame" style={{ position: 'relative', width: '600px', height: '500px' }}>
        <KeyArtSlideshow images={KEY_ART} intervalMs={8000} />
      </div>
    )
    const img = container.querySelector('img')!
    await img.decode()
    const frame = container.firstElementChild!.getBoundingClientRect()
    const box = img.getBoundingClientRect()
    expect(box.width).toBe(frame.width)
    expect(box.height).toBe(frame.height)
    expect(getComputedStyle(img).objectFit).toBe('cover')
  })
})
