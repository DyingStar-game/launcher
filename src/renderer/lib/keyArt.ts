/**
 * Every WebP in `assets/key-art/` (made by `make key-art` from `key-art/`), keyed by path, so a
 * new image joins the slideshow without touching the code.
 */
const images = import.meta.glob<string>('../assets/key-art/*.webp', {
  eager: true,
  import: 'default'
})

/** Images shown in turn behind the universe on the home page, both universes alike, by file name. */
export const KEY_ART: readonly string[] = Object.keys(images)
  .sort()
  .map((path) => images[path])

/** How long each image stays before fading into the next (milliseconds). */
export const KEY_ART_INTERVAL_MS = 8000
