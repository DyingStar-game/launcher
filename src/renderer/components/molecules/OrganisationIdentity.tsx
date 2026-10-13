import type { OrganisationRef } from '@shared/types/social'
import Avatar from '@components/atoms/Avatar'
import OrganisationLink from './OrganisationLink'

export type OrganisationIdentityProps = {
  organisation: OrganisationRef
  /** Opens the organisation's sheet (ADR 0010). */
  onOpen: () => void
  /** Lines under the name (member count, rank…). */
  children?: React.ReactNode
}

/** Ticker avatar, then the organisation's name (opens its sheet) and the given lines. */
export default function OrganisationIdentity({
  organisation,
  onOpen,
  children
}: OrganisationIdentityProps): React.JSX.Element {
  return (
    <div className="flex flex-1 min-w-0 items-center gap-3">
      <Avatar name={organisation.name} label={organisation.ticker.slice(0, 2)} shape="square" />
      <div className="flex-1 min-w-0 flex flex-col items-start">
        <OrganisationLink organisation={organisation} onOpen={onOpen} />
        {children}
      </div>
    </div>
  )
}
