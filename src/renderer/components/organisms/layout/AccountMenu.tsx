import { Loader2Icon, LogOutIcon, UserIcon } from 'lucide-react'
import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { useTranslation } from 'react-i18next'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
import { useNavigationStore } from '@stores/navigation'
import { cn } from '@lib/cn'
import Avatar from '@components/atoms/Avatar'
import Button from '@components/atoms/Button'
import MenuItemButton from '@components/atoms/MenuItemButton'
import DiscordIcon from '@components/atoms/icons/DiscordIcon'
import LabelTooltip from '@components/molecules/LabelTooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'

type AccountBlockProps = React.ComponentProps<typeof Button> & {
  avatar: React.ReactNode
  heading: string
  subtitle: string
  /** Colour of the subtitle: `online` once signed in. */
  tone?: 'online' | 'muted'
}

/** The account as a block like a friend's row (48 px): avatar, then a heading over a subtitle. */
function AccountBlock({
  avatar,
  heading,
  subtitle,
  tone = 'muted',
  ...props
}: AccountBlockProps): React.JSX.Element {
  return (
    <Button variant="secondary" size="sm" className="h-12 gap-3 p-2 pr-3" {...props}>
      {avatar}
      <span className="flex min-w-0 flex-col items-start leading-tight">
        <span className="max-w-44 truncate">{heading}</span>
        <span
          className={cn(
            'text-xs font-normal',
            tone === 'online' ? 'text-green-400' : 'text-ds-muted'
          )}
        >
          {subtitle}
        </span>
      </span>
    </Button>
  )
}

type DisabledAccountBlockProps = {
  /** Why sign-in is off, in the tooltip and as the accessible name. */
  reason: string
  heading: string
  subtitle: string
}

/** The account block when sign-in cannot be offered, with why in a tooltip. */
function DisabledAccountBlock({
  reason,
  heading,
  subtitle
}: DisabledAccountBlockProps): React.JSX.Element {
  // A disabled button gets no pointer events: the tooltip sits on a focusable wrapper
  return (
    <LabelTooltip label={reason}>
      <span tabIndex={0} className="inline-flex rounded-lg">
        <AccountBlock
          disabled
          aria-label={reason}
          avatar={<Avatar name="" icon={<UserIcon className="size-4" aria-hidden="true" />} />}
          heading={heading}
          subtitle={subtitle}
        />
      </span>
    </LabelTooltip>
  )
}

/** "My profile": the signed-in player's own sheet, once the social data knows who they are. */
function ProfileItem(): React.JSX.Element | null {
  const { t } = useTranslation()
  const selfId = useSocialSnapshot().data.selfId
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  if (!selfId) return null
  return (
    <DropdownMenuItem asChild>
      <MenuItemButton onClick={() => openPlayer(selfId)}>
        <UserIcon className="size-4" aria-hidden="true" />
        <span className="flex-1">{t('navbar.account.profile')}</span>
      </MenuItemButton>
    </DropdownMenuItem>
  )
}

/**
 * The player's account in the universe bar, for the active environment, always as the same block:
 * "Sign in / Required to play" with the Discord logo, "Sign-in unavailable / Server unreachable"
 * while the sign-in server does not answer, "Signing in… / Cancel" while the sign-in
 * window is open, or the player's avatar, name and "Signed in", opening My profile and Sign out.
 */
export default function AccountMenu(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, login, logout, cancelLogin } = useAccountStore()
  const available = useAvailabilityStore((s) => s.available[activeEnv])
  const authAvailable = useAvailabilityStore((s) => s.authAvailable[activeEnv])
  const { status, username } = data[activeEnv]

  if (!available) {
    return (
      <DisabledAccountBlock
        reason={t('navbar.account.unavailable')}
        heading={t('navbar.account.signInShort')}
        subtitle={t('navbar.account.unavailableShort')}
      />
    )
  }

  // The sign-in server is down while the universe is up (ADR 0043); a signed-in player keeps the menu
  if (!authAvailable && status !== 'connected') {
    return (
      <DisabledAccountBlock
        reason={t('navbar.account.authDown')}
        heading={t('navbar.account.authDownShort')}
        subtitle={t('navbar.account.authDownSubtitle')}
      />
    )
  }

  if (status === 'loading') {
    return (
      <AccountBlock
        onClick={cancelLogin}
        aria-label={t('navbar.account.cancel')}
        avatar={
          <Avatar
            name=""
            icon={
              <span className="inline-flex animate-spin">
                <Loader2Icon className="size-4" aria-hidden="true" />
              </span>
            }
          />
        }
        heading={t('navbar.account.connecting')}
        subtitle={t('navbar.account.cancelShort')}
      />
    )
  }

  if (status !== 'connected') {
    return (
      <AccountBlock
        onClick={() => void login()}
        aria-label={t('navbar.account.signIn')}
        avatar={<Avatar name="" icon={<DiscordIcon className="size-4" />} />}
        heading={t('navbar.account.signInShort')}
        subtitle={t('navbar.account.requiredToPlay')}
      />
    )
  }

  const name = username ?? ''
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <AccountBlock
          aria-label={t('navbar.account.menu', { name })}
          avatar={<Avatar name={name} status="online" />}
          heading={name}
          subtitle={t('navbar.account.connected')}
          tone="online"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        aria-label={t('navbar.account.menu', { name })}
        className="min-w-48"
      >
        <DropdownMenuLabel>{t('navbar.account.signedInAs', { name })}</DropdownMenuLabel>
        <ProfileItem />
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <MenuItemButton onClick={() => void logout()}>
            <LogOutIcon className="size-4" aria-hidden="true" />
            <span className="flex-1">{t('navbar.account.signOut')}</span>
          </MenuItemButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
