import { BookOpenIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import MenuItemButton from '@components/atoms/MenuItemButton'
import DiscordIcon from '@components/atoms/icons/DiscordIcon'
import { DropdownMenuItem } from '@components/ui/dropdown-menu'

export type CommunityLinkItemsProps = {
  /** Each link's URL; a missing one shows its entry disabled. */
  website?: string
  discord?: string
  wiki?: string
}

/** The community links (website, Discord, wiki) as dropdown menu entries, opened in the browser. */
export default function CommunityLinkItems({
  website,
  discord,
  wiki
}: CommunityLinkItemsProps): React.JSX.Element {
  const { t } = useTranslation()
  const links = [
    {
      url: website,
      label: t('navbar.openWebsite'),
      icon: (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 fill-current shrink-0">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.5 9h-3.2a15.7 15.7 0 00-1.1-5 8.04 8.04 0 014.3 5zM12 4c1 1.5 1.8 3.8 2.1 7H9.9C10.2 7.8 11 5.5 12 4zM4.5 13h3.2c.2 1.9.7 3.7 1.1 5a8.04 8.04 0 01-4.3-5zm0-2a8.04 8.04 0 014.3-5c-.4 1.3-.9 3.1-1.1 5H4.5zm7.5 9c-1-1.5-1.8-3.8-2.1-7h4.2c-.3 3.2-1.1 5.5-2.1 7zm3.2-2c.4-1.3.9-3.1 1.1-5h3.2a8.04 8.04 0 01-4.3 5z" />
        </svg>
      )
    },
    {
      url: discord,
      label: t('navbar.brandDiscord'),
      icon: <DiscordIcon className="size-4 shrink-0" />
    },
    {
      url: wiki,
      label: t('navbar.brandWiki'),
      icon: <BookOpenIcon className="size-4 shrink-0" aria-hidden="true" />
    }
  ]

  return (
    <>
      {links.map(({ url, label, icon }) => (
        <DropdownMenuItem asChild disabled={!url} key={label}>
          <MenuItemButton disabled={!url} onClick={() => url && window.open(url, '_blank')}>
            {icon}
            {label}
          </MenuItemButton>
        </DropdownMenuItem>
      ))}
    </>
  )
}
