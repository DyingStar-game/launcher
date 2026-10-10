import { ClockIcon, LockIcon, UserCheckIcon, UserIcon, UsersIcon } from 'lucide-react'
import Button from '@components/atoms/Button'
import { Badge } from '@components/ui/badge'

const icons = {
  friend: UserCheckIcon,
  member: UsersIcon,
  pending: ClockIcon,
  lock: LockIcon,
  self: UserIcon
}

type Props = {
  /** What the state is: friend, member of an organisation, request sent, closed, you. */
  icon: keyof typeof icons
  children: React.ReactNode
  /** Makes the badge a button opening what it names (e.g. an organisation's page). */
  onOpen?: () => void
}

/**
 * A state (friend, member, request sent, closed, you): shadcn's Badge, outlined like the presence
 * badge, with an icon telling the kind of state; with `onOpen`, a button opening what it names.
 */
export default function StatusBadge({ icon, children, onOpen }: Props): React.JSX.Element {
  const Icon = icons[icon]
  const content = (
    <>
      <Icon data-icon="inline-start" aria-hidden="true" />
      {children}
    </>
  )
  if (!onOpen) return <Badge variant="outline">{content}</Badge>
  return (
    <Badge variant="outline" asChild>
      <Button variant="bare" size="none" onClick={onOpen}>
        {content}
      </Button>
    </Badge>
  )
}
