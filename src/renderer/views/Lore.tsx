import LoreSidebar from '@components/ui/lore/LoreSidebar'
import LoreArticle from '@components/ui/lore/LoreArticle'

export default function LorePage() {
  return (
    <div className="flex h-full bg-[var(--color-ds-bg)]">
      <LoreSidebar />
      <LoreArticle />
    </div>
  )
}