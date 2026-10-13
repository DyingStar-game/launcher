import { useSocialSnapshot } from '@hooks/social/useSocialSnapshot'
import { usePageState } from '@hooks/usePageState'
import { useNavigationStore } from '@stores/navigation'
import SocialSidebar from '@components/molecules/SocialSidebar'
import FriendsSection from '@components/organisms/social/FriendsSection'
import OrganisationsSection from '@components/organisms/social/OrganisationsSection'
import SidebarPageLayout from '@components/templates/SidebarPageLayout'
import { Tabs, TabsContent } from '@components/ui/tabs'
import { pendingCounts, type SocialSection, type SocialSubTab } from '@lib/socialSections'

/** Full social page: friends and organisations sections, each with its sub-tabs (ADR 0023). */
export default function SocialPage(): React.JSX.Element {
  const { data } = useSocialSnapshot()
  const openPlayer = useNavigationStore((s) => s.openPlayer)

  const [section, setSection] = usePageState<SocialSection>('section', 'friends')
  const [friendsTab, setFriendsTab] = usePageState<SocialSubTab>('tab:friends', 'mine')
  const [organisationsTab, setOrganisationsTab] = usePageState<SocialSubTab>(
    'tab:organisations',
    'mine'
  )

  return (
    // Radix tabs (ADR 0016): the sidebar is the section list, the content column its panel
    <Tabs
      value={section}
      onValueChange={(next) => setSection(next as SocialSection)}
      orientation="vertical"
      className="contents"
    >
      <SidebarPageLayout
        sidebar={
          <SocialSidebar
            current={section}
            pending={pendingCounts(data)}
            onOpenProfile={data.selfId ? () => openPlayer(data.selfId) : undefined}
          />
        }
      >
        <TabsContent value={section} className="flex min-h-0 flex-col gap-4">
          {section === 'friends' ? (
            <FriendsSection tab={friendsTab} onTabChange={setFriendsTab} />
          ) : (
            <OrganisationsSection tab={organisationsTab} onTabChange={setOrganisationsTab} />
          )}
        </TabsContent>
      </SidebarPageLayout>
    </Tabs>
  )
}
