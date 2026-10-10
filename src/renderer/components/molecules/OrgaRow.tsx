import { useTranslation } from 'react-i18next'
import type { Organisation } from '@shared/types/social'
import Avatar from '@components/atoms/Avatar'
import OrganisationLink from './OrganisationLink'

type Props = {
  orga: Organisation
  /** Opens the organisation's sheet. */
  onOpen: () => void
  /** Join action or status badge, provided by the caller. */
  action?: React.ReactNode
}

/** Organisation row: ticker avatar, name (opens its sheet), member count, then the action. */
export default function OrgaRow({ orga, onOpen, action }: Props): React.JSX.Element {
  const { t } = useTranslation()

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
      <Avatar name={orga.name} label={orga.ticker.slice(0, 2)} shape="square" />
      <div className="flex-1 min-w-0 flex flex-col items-start">
        <OrganisationLink organisation={orga} onOpen={onOpen} />
        <span className="text-xs text-[var(--color-ds-muted)]">
          {t('universe.socialPage.orga.members', { count: orga.members })}
        </span>
      </div>
      {action}
    </div>
  )
}
