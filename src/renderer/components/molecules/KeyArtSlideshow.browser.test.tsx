import { describe, expect, it } from 'vitest'
import { render } from '../../test/render'
import { KEY_ART } from '@lib/keyArt'
import KeyArtSlideshow from './KeyArtSlideshow'
import UniverseHeading from './UniverseHeading'

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

  it('darkens the bottom up to just above the universe name, and leaves the rest clear', () => {
    // As on the home page: the name at the bottom of its padded frame, version line under it
    const { container } = render(
      <div className="relative flex h-150 w-200 flex-col p-10">
        <KeyArtSlideshow images={KEY_ART} intervalMs={8000} />
        <div className="relative mt-auto flex flex-col gap-5">
          <UniverseHeading
            name="Universe Testing"
            tagline="Test new features"
            version="20261012000000"
            releaseDate="12/10/2026"
          />
        </div>
      </div>
    )
    const frame = container.firstElementChild!.getBoundingClientRect()
    const band = container.querySelector('[aria-hidden] > div')!.getBoundingClientRect()
    const name = container.querySelector('h1')!.getBoundingClientRect()
    // Dark up to 55% of the band, fading out above: the name stays in the dark part
    expect(band.bottom).toBe(frame.bottom)
    expect(band.bottom - band.height * 0.55).toBeLessThanOrEqual(name.top)
    expect(band.top).toBeLessThan(name.top)
    expect(band.top).toBeGreaterThan(frame.top + frame.height / 3)
  })
})
