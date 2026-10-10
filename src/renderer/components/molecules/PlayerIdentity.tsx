import { useTranslation } from 'react-i18next'
import type { FriendStatus } from '@shared/types/social'
import Avatar from '@components/atoms/Avatar'

type Props = {
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
}: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('universe.socialPage.profile.openAria', { name })}
      className="flex flex-1 min-w-0 items-center gap-3 text-left rounded-lg cursor-pointer focus-visible:outline focus-visible:outline-[var(--color-ds-accent)]"
    >
      <Avatar name={name} status={status} />
      <div className="flex-1 min-w-0 flex flex-col leading-tight">
        <span className="text-sm font-medium text-[var(--color-ds-text)] truncate hover:underline">
          {name}
        </span>
        {children}
      </div>
    </button>
  )
}
