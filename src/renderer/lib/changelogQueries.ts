/**
 * Query key of the changelog (ADR 0025, 0051): one key, `changelog:fetch` answering for every
 * environment at once.
 */
export const changelogKeys = {
  all: ['changelog'] as const
}
