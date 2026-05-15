/** Error codes thrown by the social store for i18n lookup in the UI. */
export const SOCIAL_ERROR = {
  ORGA_NAME_TAKEN: 'orgaNameTaken',
  FRIEND_REQUEST_FAILED: 'friendRequestFailed'
} as const

export type SocialErrorCode = (typeof SOCIAL_ERROR)[keyof typeof SOCIAL_ERROR]

export class SocialStoreError extends Error {
  constructor(public readonly code: SocialErrorCode) {
    super(code)
    this.name = 'SocialStoreError'
  }
}

/** Maps a social store error to a translated message, or uses the fallback i18n key. */
export function getSocialErrorMessage(
  err: unknown,
  translate: (key: string) => string,
  fallbackKey = 'universe.socialPage.errors.joinOrgaFailed'
): string {
  if (err instanceof SocialStoreError) {
    return translate(`universe.socialPage.errors.${err.code}`)
  }
  if (err instanceof Error && err.message) {
    return err.message
  }
  return translate(fallbackKey)
}
