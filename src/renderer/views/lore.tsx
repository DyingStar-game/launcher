import LoreSidebar from '@components/ui/loreSidebar'
import LoreArticle from '@components/ui/loreArticle'

export default function LorePage() {
  return (
    <div className="flex h-full bg-[var(--color-ds-bg)]">
      <LoreSidebar />
      <LoreArticle />
    </div>
  )
}