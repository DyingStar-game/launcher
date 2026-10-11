import type { OrganisationRef } from '@shared/types/social'
import OrganisationIdentity from './OrganisationIdentity'

export type OrgaRowProps = {
  orga: OrganisationRef
  /** Line under the name: member count in the directory, the player's rank in their own. */
  detail: string
  /** Opens the organisation's sheet. */
  onOpen: () => void
  /** Join action or status badge, provided by the caller. */
  action?: React.ReactNode
}

/** Organisation row: ticker avatar, name (opens its sheet), a detail line, then the action. */
export default function OrgaRow({ orga, detail, onOpen, action }: OrgaRowProps): React.JSX.Element {
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
      <OrganisationIdentity organisation={orga} onOpen={onOpen}>
        <span className="text-xs text-ds-muted">{detail}</span>
      </OrganisationIdentity>
      {action}
    </div>
  )
}
