import { useEffect, useState } from 'react'
import { cn } from '@lib/cn'

export type KeyArtSlideshowProps = {
  /** Image URLs, shown in turn; one image stays still. */
  images: readonly string[]
  /** How long each image stays before fading into the next (milliseconds). */
  intervalMs: number
}

/**
 * Full-frame images fading into one another in a loop, under a dark band at the bottom that keeps
 * the universe's name and the lines under it readable, fading out just above the name; the rest of
 * the image stays clear. Fixed height, as the name sits at a fixed distance from the bottom.
 * Decorative.
 */
export default function KeyArtSlideshow({
  images,
  intervalMs
}: KeyArtSlideshowProps): React.JSX.Element {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (images.length < 2) return
    const id = window.setInterval(() => setCurrent((i) => (i + 1) % images.length), intervalMs)
    return () => window.clearInterval(id)
  }, [images.length, intervalMs])

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className={cn(
            'absolute inset-0 size-full object-cover transition-opacity duration-1500 ease-in-out motion-reduce:transition-none',
            index === current ? 'opacity-100' : 'opacity-0'
          )}
        />
      ))}
      <div className="absolute inset-x-0 bottom-0 h-72 bg-linear-to-t from-ds-bg/60 via-ds-bg/45 via-55% to-transparent" />
    </div>
  )
}
