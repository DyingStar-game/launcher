import { useTranslation } from 'react-i18next'
import type { FriendStatus } from '@shared/types/social'
import { UiSoundProfile } from '@shared/types/sounds'
import Avatar from '@components/atoms/Avatar'
import Button from '@components/atoms/Button'

export type PlayerIdentityProps = {
  name: string
  /** Presence dot on the avatar. */
  status?: FriendStatus
  /** Opens the player's sheet (ADR 0009). */
  onOpen: () => void
  /** Lines under the name (status, rank…). */
  children?: React.ReactNode
}

/** Avatar and name of a player, as a button opening their sheet. */
export default function PlayerIdentity({
  name,
  status,
  onOpen,
  children
}: PlayerIdentityProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Button
      variant="bare"
      size="none"
      soundProfile={UiSoundProfile.None}
      onClick={onOpen}
      aria-label={t('universe.socialPage.profile.openAria', { name })}
      className="flex flex-1 min-w-0 justify-start gap-3 text-left"
    >
      <Avatar name={name} status={status} />
      <div className="flex-1 min-w-0 flex flex-col leading-tight">
        <span className="text-sm font-medium text-ds-text truncate hover:underline">{name}</span>
        {children}
      </div>
    </Button>
  )
}
