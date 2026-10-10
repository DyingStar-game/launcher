import type React from 'react'
import LoreSidebar from '@components/ui/lore/LoreSidebar'
import LoreArticle from '@components/ui/lore/LoreArticle'

/** Lore page: article sidebar and markdown content viewer. */
export default function LorePage(): React.JSX.Element {
  return (
    <div className="ds-page">
      <LoreSidebar />
      <LoreArticle />
    </div>
  )
}
