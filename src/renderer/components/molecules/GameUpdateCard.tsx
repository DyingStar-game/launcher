import { useTranslation } from 'react-i18next'
import { ArrowRightIcon, Clock3Icon } from 'lucide-react'
import Button from '@components/atoms/Button'
import Panel from '@components/atoms/Panel'

export type GameUpdateCardProps = {
  onOpenChangelog: () => void
}

/**
 * A newer game version is out, with a link to its changelog; its builds and release date are under
 * "Update required" in the action bar.
 */
export default function GameUpdateCard({
  onOpenChangelog
}: GameUpdateCardProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <Panel variant="card" className="flex max-w-120 items-start gap-3 px-4 py-3">
      <span className="mt-0.5 inline-flex text-ds-text">
        <Clock3Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h2 className="text-sm font-semibold text-ds-text">{t('universe.gameUpdate.title')}</h2>
        <Button variant="link" size="none" onClick={onOpenChangelog} className="self-start">
          {t('universe.gameUpdate.seeChangelog')}
          <ArrowRightIcon aria-hidden="true" />
        </Button>
      </div>
    </Panel>
  )
}
