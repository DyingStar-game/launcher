import LoreSidebar from '@components/organisms/lore/LoreSidebar'
import LoreArticle from '@components/organisms/lore/LoreArticle'
import SidebarPageLayout from '@components/templates/SidebarPageLayout'

/** Lore page: article sidebar and markdown content viewer. */
export default function LorePage(): React.JSX.Element {
  return (
    <SidebarPageLayout sidebar={<LoreSidebar />} bare>
      <LoreArticle />
    </SidebarPageLayout>
  )
}
