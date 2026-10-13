import { useTranslation } from 'react-i18next'
import type { PlayerSearchResult } from '@shared/types/social'
import { MIN_QUERY, usePlayerSearch } from '@hooks/social/useSocialSearch'
import { useNavigationStore } from '@stores/navigation'
import { usePageState, useScrollMemory } from '@hooks/usePageState'
import InputField from '@components/molecules/InputField'
import FriendAction from './FriendAction'
import ListRow from '@components/atoms/ListRow'
import PlayerIdentity from '@components/molecules/PlayerIdentity'
import ListSkeleton from '@components/molecules/ListSkeleton'
import { useDelayedFlag } from '@hooks/useDelayedFlag'
import Panel from '@components/atoms/Panel'

/** Player search screen: results while typing, each with a friend request action (ADR 0008). */
export default function PlayerSearch(): React.JSX.Element {
  const { t } = useTranslation()
  const [query, setQuery] = usePageState('playerQuery', '')
  const state = usePlayerSearch(query)
  const resultsRef = useScrollMemory<HTMLDivElement>('scroll:players', state.kind === 'results')
  const showSkeleton = useDelayedFlag(state.kind === 'searching')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <InputField
        label={t('universe.socialPage.playerSearch.label')}
        value={query}
        onChange={setQuery}
        placeholder={t('universe.socialPage.playerSearch.placeholder')}
      />

      <Panel className="flex-1 min-h-0 overflow-hidden">
        <div ref={resultsRef} className="h-full overflow-y-auto p-3 flex flex-col gap-2">
          {state.kind === 'idle' && (
            <p className="text-sm text-ds-muted p-2">
              {t('universe.socialPage.searchMinChars', { count: MIN_QUERY })}
            </p>
          )}
          {showSkeleton && <ListSkeleton action />}
          {state.kind === 'error' && <p className="text-sm text-red-400 p-2">{state.message}</p>}
          {state.kind === 'results' && state.items.length === 0 && (
            <p className="text-sm text-ds-muted p-2">
              {t('universe.socialPage.playerSearch.empty')}
            </p>
          )}
          {state.kind === 'results' &&
            state.items.map((player) => <PlayerResultRow key={player.id} player={player} />)}
        </div>
      </Panel>
    </div>
  )
}

type PlayerResultRowProps = { player: PlayerSearchResult }

/** One found player: name (opens their sheet), then the friend action. */
function PlayerResultRow({ player }: PlayerResultRowProps): React.JSX.Element {
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  return (
    <ListRow>
      <PlayerIdentity name={player.name} onOpen={() => openPlayer(player.id)} />
      <FriendAction playerId={player.id} name={player.name} />
    </ListRow>
  )
}
