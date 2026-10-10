import type { SocialErrorCode } from '@shared/types/social'

/** Error thrown by the social store with the code main returned, for i18n lookup in the UI. */
export class SocialStoreError extends Error {
  constructor(public readonly code: SocialErrorCode) {
    super(code)
    this.name = 'SocialStoreError'
  }
}

/** Maps a social store error to a translated message (`universe.socialPage.errors.<code>`). */
export function getSocialErrorMessage(err: unknown, translate: (key: string) => string): string {
  const code: SocialErrorCode = err instanceof SocialStoreError ? err.code : 'unknown'
  return translate(`universe.socialPage.errors.${code}`)
}
