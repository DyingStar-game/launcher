import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Membership, PlayerProfile } from '@shared/types/social'
import { useInviteToOrganisation } from '@hooks/social/useSocialActions'
import { getSocialErrorMessage } from '@lib/socialErrors'
import Button from '@components/atoms/Button'
import MenuItemButton from '@components/atoms/MenuItemButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'

/**
 * Invites a player to the given organisations (ADR 0021, `invite`; those that have not invited
 * them yet, `useInvitationTargets`): one → a button, several → a menu. Nothing when there is
 * none. Once invited, the organisation leaves the list: the page shows the invitation instead.
 */
export default function InviteToOrganisation({
  player,
  organisations
}: {
  player: PlayerProfile
  organisations: Membership[]
}): React.JSX.Element | null {
  const { t } = useTranslation()
  const invite = useInviteToOrganisation()
  const [error, setError] = useState('')
  if (organisations.length === 0) return null

  const send = async (organisation: Membership): Promise<void> => {
    setError('')
    try {
      await invite.mutateAsync({ organisationId: organisation.id, playerId: player.id })
    } catch (err) {
      setError(getSocialErrorMessage(err, t))
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      {organisations.length === 1 ? (
        <Button
          variant="outline"
          loading={invite.isPending}
          onClick={() => void send(organisations[0])}
        >
          {t('universe.socialPage.manage.invite.to', { name: organisations[0].name })}
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" loading={invite.isPending}>
              {t('universe.socialPage.manage.invite.action')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            aria-label={t('universe.socialPage.manage.invite.action')}
          >
            {organisations.map((organisation) => (
              <DropdownMenuItem asChild key={organisation.id}>
                <MenuItemButton onClick={() => void send(organisation)}>
                  {organisation.name} [{organisation.ticker}]
                </MenuItemButton>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </div>
  )
}
