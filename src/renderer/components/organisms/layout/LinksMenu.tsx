import { UsersIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import CommunityLinkItems from '@components/molecules/CommunityLinkItems'
import LabelTooltip from '@components/molecules/LabelTooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import { navUrls } from '@lib/env'

/** Navbar community button: opens the community links (website, Discord, wiki). */
export default function LinksMenu(): React.JSX.Element {
  const { t } = useTranslation()
  const { website, discord, wiki } = navUrls()

  return (
    <DropdownMenu>
      <LabelTooltip label={t('navbar.links')}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t('navbar.links')}>
            <UsersIcon className="size-4.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </LabelTooltip>

      <DropdownMenuContent align="end" aria-label={t('navbar.links')} className="min-w-48">
        <CommunityLinkItems website={website} discord={discord} wiki={wiki} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
