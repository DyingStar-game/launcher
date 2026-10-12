import { useEffect, useState } from 'react'
import { cn } from '@lib/cn'

export type KeyArtSlideshowProps = {
  /** Image URLs, shown in turn; one image stays still. */
  images: readonly string[]
  /** How long each image stays before fading into the next (milliseconds). */
  intervalMs: number
}

/**
 * Full-frame images fading into one another in a loop, under a dark gradient that keeps the text
 * laid over them readable (bottom and left, where the universe's name sits). Decorative.
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
      <div className="absolute inset-0 bg-linear-to-t from-ds-bg/90 via-ds-bg/30 via-35% to-transparent to-60%" />
      <div className="absolute inset-0 bg-linear-to-r from-ds-bg/85 via-ds-bg/40 via-30% to-transparent to-60%" />
    </div>
  )
}
