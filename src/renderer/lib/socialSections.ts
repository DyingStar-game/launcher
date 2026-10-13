import type { SocialSnapshot } from '@shared/types/social'

/** Sections of the social page, in sidebar order (ADR 0023). */
export const SOCIAL_SECTIONS = ['friends', 'organisations'] as const
export type SocialSection = (typeof SOCIAL_SECTIONS)[number]

/** Sub-tabs of each section, in order: the player's own, search, pending requests. */
export const SOCIAL_SUB_TABS = ['mine', 'find', 'requests'] as const
export type SocialSubTab = (typeof SOCIAL_SUB_TABS)[number]

/**
 * Requests waiting for the player's answer, per section (ADR 0023, 0024): friend requests
 * received; organisation invitations received and applications to answer.
 */
export function pendingCounts(
  data: Pick<SocialSnapshot, 'incoming' | 'invitations' | 'receivedApplications'>
): Record<SocialSection, number> {
  const received = data.receivedApplications.reduce((n, g) => n + g.applications.length, 0)
  return { friends: data.incoming.length, organisations: data.invitations.length + received }
}
