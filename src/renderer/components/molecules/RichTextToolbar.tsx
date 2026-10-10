import {
  BoldIcon,
  ItalicIcon,
  MinusIcon,
  PaletteIcon,
  StrikethroughIcon,
  UnderlineIcon
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'
import MenuItemButton from '@components/atoms/MenuItemButton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@components/ui/dropdown-menu'
import { Toggle } from '@components/ui/toggle'
import { BBCODE_COLORS } from '@lib/bbcode'
import LabelTooltip from './LabelTooltip'

/** Marks the toolbar toggles (ADR 0030). */
export type RichTextMark = 'bold' | 'italic' | 'underline' | 'strike'

type Props = {
  /** Marks active at the caret or on the selection. */
  active: Record<RichTextMark, boolean>
  onToggle: (mark: RichTextMark) => void
  /** Colours the selection; `null` gives it back the default colour. */
  onColor: (color: string | null) => void
  onRule: () => void
  disabled?: boolean
}

const MARKS = [
  { mark: 'bold', label: 'bbcode.bold', Icon: BoldIcon },
  { mark: 'italic', label: 'bbcode.italic', Icon: ItalicIcon },
  { mark: 'underline', label: 'bbcode.underline', Icon: UnderlineIcon },
  { mark: 'strike', label: 'bbcode.strike', Icon: StrikethroughIcon }
] as const

/** Formatting toolbar of the rich text editor: the six things the game reads (ADR 0014, 0030). */
export default function RichTextToolbar({
  active,
  onToggle,
  onColor,
  onRule,
  disabled = false
}: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div role="toolbar" aria-label={t('bbcode.toolbar')} className="flex items-center gap-1">
      {MARKS.map(({ mark, label, Icon }) => (
        <LabelTooltip key={mark} label={t(label)}>
          <Toggle
            size="sm"
            aria-label={t(label)}
            pressed={active[mark]}
            onPressedChange={() => onToggle(mark)}
            disabled={disabled}
          >
            <Icon aria-hidden="true" />
          </Toggle>
        </LabelTooltip>
      ))}
      <DropdownMenu>
        <LabelTooltip label={t('bbcode.color')}>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button variant="ghost" size="icon-sm" aria-label={t('bbcode.color')}>
              <PaletteIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </LabelTooltip>
        <DropdownMenuContent aria-label={t('bbcode.color')}>
          {BBCODE_COLORS.map((color) => (
            <DropdownMenuItem asChild key={color}>
              <MenuItemButton onClick={() => onColor(color)}>
                <span
                  aria-hidden="true"
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {t(`bbcode.colors.${color}`)}
              </MenuItemButton>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <MenuItemButton onClick={() => onColor(null)}>
              {t('bbcode.defaultColor')}
            </MenuItemButton>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <LabelTooltip label={t('bbcode.rule')}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={t('bbcode.rule')}
          disabled={disabled}
          onClick={onRule}
        >
          <MinusIcon aria-hidden="true" />
        </Button>
      </LabelTooltip>
    </div>
  )
}
