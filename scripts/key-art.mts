// Converts the home page's key art to WebP: every PNG / JPEG dropped in `key-art/` (not versioned)
// becomes `src/renderer/assets/key-art/key-art-<NN>.webp`, which the home slideshow picks up by
// itself. A new image takes the number after the highest one and its source is renamed to match,
// so it keeps the same WebP when converted again.
// Encodes with the headless Chromium of the rendering tests (no image tool to install).
//
//   make key-art                      convert what is new or changed
//   make key-art ARGS="--force"       convert everything again
//   make key-art ARGS="--quality=0.9" WebP quality, 0 to 1 (default 0.82)
import {
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
  mkdirSync,
  existsSync
} from 'node:fs'
import { basename, extname, join, resolve } from 'node:path'
import { chromium, type Browser } from 'playwright'

const SOURCE_DIR = resolve('key-art')
const TARGET_DIR = resolve('src/renderer/assets/key-art')
const TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
}

const args = process.argv.slice(2)
const force = args.includes('--force')
const qualityArg = args.find((arg) => arg.startsWith('--quality='))
const quality = qualityArg ? Number(qualityArg.split('=')[1]) : 0.82
if (!(quality > 0 && quality <= 1)) {
  console.error(`Quality must be between 0 and 1, got ${qualityArg}`)
  process.exit(1)
}

/** `key-art-04.png` → 4; `null` for a name outside the numbering */
const NUMBERED = /^key-art-(\d+)$/
const numberOf = (file: string): number | null => {
  const match = NUMBERED.exec(basename(file, extname(file)).toLowerCase())
  return match ? Number(match[1]) : null
}

/** `key-art-04.PNG` → `key-art-04.webp` */
const targetName = (file: string): string => basename(file, extname(file)).toLowerCase() + '.webp'

const kb = (bytes: number): string => `${Math.round(bytes / 1024)} KB`

if (!existsSync(SOURCE_DIR)) {
  mkdirSync(SOURCE_DIR)
  console.log('Created key-art/: drop the PNG or JPEG images there, then run make key-art again.')
  process.exit(0)
}
mkdirSync(TARGET_DIR, { recursive: true })

const isImage = (file: string): boolean => extname(file).toLowerCase() in TYPES
let next =
  Math.max(
    0,
    ...[...readdirSync(SOURCE_DIR), ...readdirSync(TARGET_DIR)]
      .map(numberOf)
      .filter((n) => n !== null)
  ) + 1
for (const file of readdirSync(SOURCE_DIR).filter(isImage).sort()) {
  if (numberOf(file) !== null) continue
  const numbered = `key-art-${String(next++).padStart(2, '0')}${extname(file).toLowerCase()}`
  renameSync(join(SOURCE_DIR, file), join(SOURCE_DIR, numbered))
  console.log(`${file} → key-art/${numbered}`)
}

const sources = readdirSync(SOURCE_DIR).filter(isImage)
const todo = sources.filter((file) => {
  const target = join(TARGET_DIR, targetName(file))
  return (
    force ||
    !existsSync(target) ||
    statSync(target).mtimeMs < statSync(join(SOURCE_DIR, file)).mtimeMs
  )
})
if (todo.length === 0) {
  console.log(sources.length ? 'Key art up to date.' : 'No PNG or JPEG image in key-art/.')
  process.exit(0)
}

let browser: Browser
try {
  browser = await chromium.launch()
} catch {
  console.error(
    'Headless Chromium is missing: run make install (or make pnpm test:browser:install).'
  )
  process.exit(1)
}
const page = await browser.newPage()

for (const file of todo) {
  const source = join(SOURCE_DIR, file)
  const target = join(TARGET_DIR, targetName(file))
  const input = readFileSync(source)
  const src = `data:${TYPES[extname(file).toLowerCase()]};base64,${input.toString('base64')}`
  const dataUrl = await page.evaluate(
    async ({ src, quality }) => {
      const image = new Image()
      image.src = src
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d')?.drawImage(image, 0, 0)
      return canvas.toDataURL('image/webp', quality)
    },
    { src, quality }
  )
  const output = Buffer.from(dataUrl.split(',')[1], 'base64')
  writeFileSync(target, output)
  console.log(
    `${file} (${kb(input.length)}) → assets/key-art/${basename(target)} (${kb(output.length)})`
  )
}

await browser.close()
