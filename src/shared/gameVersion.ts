const BUILD_ID_RE = /^(\d{14})/

/** Normalizes API/disk version strings (trim, 14-digit build id prefix). */
export function normalizeGameVersion(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(BUILD_ID_RE)
  if (match) return match[1]
  return trimmed
}

/**
 * Compares full build ids (`YYYYMMDDHHMMSS`) for ordering on disk (newest manifest wins).
 */
export function compareGameBuildIds(a: string, b: string): number {
  const left = normalizeGameVersion(a)
  const right = normalizeGameVersion(b)
  if (/^\d{14}$/.test(left) && /^\d{14}$/.test(right)) {
    if (left === right) return 0
    return left > right ? 1 : -1
  }
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

/**
 * Compares game versions for update checks.
 * 14-digit build ids use minute precision (`YYYYMMDDHHMM`) so UI dates without seconds
 * match the update decision (e.g. `…223013` vs `…223014` → same release minute).
 */
export function compareGameVersions(a: string, b: string): number {
  const left = normalizeGameVersion(a)
  const right = normalizeGameVersion(b)
  if (/^\d{14}$/.test(left) && /^\d{14}$/.test(right)) {
    const leftMinute = left.slice(0, 12)
    const rightMinute = right.slice(0, 12)
    if (leftMinute === rightMinute) return 0
    return leftMinute > rightMinute ? 1 : -1
  }
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
}

/** Formats a 14-digit build id as `DD/MM/YYYY HH:mm` (no seconds). */
export function formatGameVersionDisplay(v: string): string {
  const id = normalizeGameVersion(v)
  if (/^\d{14}$/.test(id)) {
    const date = `${id.slice(6, 8)}/${id.slice(4, 6)}/${id.slice(0, 4)}`
    const time = `${id.slice(8, 10)}:${id.slice(10, 12)}`
    return `${date} ${time}`
  }
  return v.trim()
}
