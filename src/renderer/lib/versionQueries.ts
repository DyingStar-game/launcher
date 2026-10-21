/**
 * Query key of the latest game versions (ADR 0025, 0045): one key, `version:check-game` answering
 * for every environment at once.
 */
export const versionKeys = {
  game: ['versions', 'game'] as const
}
