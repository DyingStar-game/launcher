import { CheckIcon, LanguagesIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import MenuItemButton from '@components/atoms/MenuItemButton'
import LabelTooltip from '@components/molecules/LabelTooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import { LANGUAGES, currentLanguage } from '@lib/languages'

/** Navbar language button: opens the list of UI languages, labelled in the current one. */
export default function LanguageMenu(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const current = currentLanguage(i18n)

  return (
    <DropdownMenu>
      <LabelTooltip label={t('navbar.language')}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t('navbar.language')}>
            <LanguagesIcon className="size-4.5" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </LabelTooltip>

      <DropdownMenuContent align="end" aria-label={t('navbar.language')} className="min-w-40">
        {LANGUAGES.map(({ code, labelKey }) => (
          <DropdownMenuItem asChild key={code}>
            <MenuItemButton
              selected={current === code}
              onClick={() => void i18n.changeLanguage(code)}
            >
              <span className="flex-1">{t(labelKey)}</span>
              {current === code && (
                <span className="shrink-0 text-ds-accent">
                  <CheckIcon className="size-4" aria-hidden="true" />
                </span>
              )}
            </MenuItemButton>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
