import { LogOutIcon, UserIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAccountStore } from '@stores/account'
import { useAvailabilityStore } from '@stores/availability'
import { useEnvStore } from '@stores/env'
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
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'

/**
 * The player's account in the navbar, for the active environment: Sign in (Discord), Cancel while
 * the sign-in window is open, or the player's avatar opening Sign out once signed in.
 */
export default function AccountMenu(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, login, logout, cancelLogin } = useAccountStore()
  const available = useAvailabilityStore((s) => s.available[activeEnv])
  const { status, username } = data[activeEnv]

  if (!available) {
    // A disabled button gets no pointer events: the tooltip sits on a focusable wrapper
    return (
      <LabelTooltip label={t('navbar.account.unavailable')}>
        <span tabIndex={0} className="inline-flex rounded-lg">
          <Button
            variant="outline"
            size="icon"
            disabled
            aria-label={t('navbar.account.unavailable')}
          >
            <UserIcon className="size-4.5" aria-hidden="true" />
          </Button>
        </span>
      </LabelTooltip>
    )
  }

  if (status === 'loading') {
    return (
      <Button variant="outline" size="sm" onClick={cancelLogin}>
        {t('navbar.account.cancel')}
      </Button>
    )
  }

  if (status !== 'connected') {
    return (
      <Button variant="outline" size="sm" onClick={() => void login()}>
        <DiscordIcon className="size-4.5" />
        {t('navbar.account.signIn')}
      </Button>
    )
  }

  const name = username ?? ''
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={t('navbar.account.menu', { name })}>
          <Avatar name={name} size="xs" />
          <span className="hidden max-w-32 truncate nav-full:inline">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        aria-label={t('navbar.account.menu', { name })}
        className="min-w-48"
      >
        <DropdownMenuLabel>{t('navbar.account.signedInAs', { name })}</DropdownMenuLabel>
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
