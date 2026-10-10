import TabButton from '@components/atoms/TabButton'
import { TabsList, TabsTrigger } from '@components/ui/tabs'
import PendingCount from './PendingCount'

type SubTab = {
  value: string
  label: string
  /** Requests waiting, shown as a count (ADR 0023). */
  pending?: number
}

type Props = {
  /** Accessible name of the tab list. */
  label: string
  /** Current tab, highlighted; switching goes through the enclosing `Tabs` (ADR 0016). */
  current: string
  tabs: SubTab[]
}

/** Row of sub-tabs inside a social page section (ADR 0023), in a horizontal `Tabs`. */
export default function SubTabList({ label, current, tabs }: Props): React.JSX.Element {
  return (
    <TabsList aria-label={label} variant="plain" className="flex h-auto gap-1">
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} asChild>
          <TabButton selected={current === tab.value} className="flex items-center gap-2">
            {tab.label}
            <PendingCount count={tab.pending ?? 0} />
          </TabButton>
        </TabsTrigger>
      ))}
    </TabsList>
  )
}
