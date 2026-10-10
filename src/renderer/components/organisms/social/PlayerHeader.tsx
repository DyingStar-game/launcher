import { useTranslation } from 'react-i18next'
import type { PlayerProfile } from '@shared/types/social'
import { useEnvStore } from '@stores/env'
import { useSocialStore } from '@stores/social'
import Avatar from '@components/atoms/Avatar'
import FriendAction from './FriendAction'

/**
 * Identity of a player page (ADR 0012): avatar, name, status (with the star system of a friend
 * in mission), faction and role, and the friend action.
 */
export default function PlayerHeader({ profile }: { profile: PlayerProfile }): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const friend = useSocialStore((s) => s.data[activeEnv].friends.find((f) => f.id === profile.id))
  const system = profile.status === 'mission' ? friend?.system : undefined
  const statusLabel = system
    ? t('friendStatus.missionIn', { system })
    : t(`friendStatus.${profile.status}`)

  return (
    <div className="flex items-center gap-4">
      <Avatar name={profile.name} size="lg" status={profile.status} />
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-[var(--color-ds-text)] truncate">{profile.name}</h1>
        <p className="text-xs text-[var(--color-ds-muted)]">{statusLabel}</p>
        {(profile.faction || profile.role) && (
          <p className="text-xs text-[var(--color-ds-muted)]">
            {[profile.faction, profile.role].filter(Boolean).join(' • ')}
          </p>
        )}
      </div>
      <FriendAction playerId={profile.id} name={profile.name} />
    </div>
  )
}
