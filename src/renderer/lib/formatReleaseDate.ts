/**
 * Formats a release date for display as DD/MM/YYYY (French UI locale).
 * Accepts ISO dates, YYYYMMDDHHMMSS build ids, and parseable date strings.
 */
export function formatReleaseDateDisplay(raw: string | null | undefined): string {
  if (raw == null || raw === '') return '—'

  const trimmed = raw.trim()

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) {
    const [, y, m, d] = iso
    return `${d}/${m}/${y}`
  }

  if (/^\d{14}$/.test(trimmed)) {
    const y = trimmed.slice(0, 4)
    const m = trimmed.slice(4, 6)
    const d = trimmed.slice(6, 8)
    return `${d}/${m}/${y}`
  }

  const t = Date.parse(trimmed)
  if (!Number.isNaN(t)) {
    const dt = new Date(t)
    const dd = String(dt.getUTCDate()).padStart(2, '0')
    const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = dt.getUTCFullYear()
    return `${dd}/${mm}/${yyyy}`
  }

  return trimmed
}
