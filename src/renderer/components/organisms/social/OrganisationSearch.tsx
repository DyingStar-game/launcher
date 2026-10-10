import { useTranslation } from 'react-i18next'
import { MIN_QUERY, useOrganisationSearch } from '@hooks/social/useSocialSearch'
import { useNavigationStore } from '@stores/navigation'
import { usePageState, useScrollMemory } from '@hooks/usePageState'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import InputField from '@components/molecules/InputField'
import ListPanel from '@components/molecules/ListPanel'
import ListSkeleton from '@components/molecules/ListSkeleton'
import OrgaRow from '@components/molecules/OrgaRow'
import OrganisationAction from './OrganisationAction'

/**
 * Organisation search screen (ADR 0024): results while typing, by name or tag, each with its
 * join action — the same way as the player search (ADR 0008).
 */
export default function OrganisationSearch(): React.JSX.Element {
  const { t } = useTranslation()
  const openOrganisation = useNavigationStore((s) => s.openOrganisation)
  const [query, setQuery] = usePageState('organisationQuery', '')
  const state = useOrganisationSearch(query)
  const resultsRef = useScrollMemory<HTMLDivElement>(
    'scroll:organisationSearch',
    state.kind === 'results'
  )
  const showSkeleton = useDelayedFlag(state.kind === 'searching')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <InputField
        label={t('universe.socialPage.orgaSearch.label')}
        value={query}
        onChange={setQuery}
        placeholder={t('universe.socialPage.orgaSearch.placeholder')}
      />

      <ListPanel ref={resultsRef}>
        {state.kind === 'idle' && (
          <p className="text-sm text-[var(--color-ds-muted)] p-2">
            {t('universe.socialPage.searchMinChars', { count: MIN_QUERY })}
          </p>
        )}
        {showSkeleton && <ListSkeleton avatar="square" action />}
        {state.kind === 'error' && <p className="text-sm text-red-400 p-2">{state.message}</p>}
        {state.kind === 'results' && state.items.length === 0 && (
          <p className="text-sm text-[var(--color-ds-muted)] p-2">
            {t('universe.socialPage.emptyDirectory')}
          </p>
        )}
        {state.kind === 'results' &&
          state.items.map((o) => (
            <OrgaRow
              key={o.id}
              orga={o}
              detail={t('universe.socialPage.orga.members', { count: o.members })}
              onOpen={() => openOrganisation(o.id)}
              action={<OrganisationAction id={o.id} name={o.name} recruitment={o.recruitment} />}
            />
          ))}
      </ListPanel>
    </div>
  )
}
