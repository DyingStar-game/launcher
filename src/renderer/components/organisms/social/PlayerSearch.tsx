import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerSearchResult } from '@shared/types/social'
import { useNavigationStore } from '@stores/navigation'
import { usePageState, useScrollMemory } from '@hooks/usePageState'
import { useSocialStore } from '@stores/social'
import InputField from '@components/molecules/InputField'
import { getSocialErrorMessage } from '@lib/socialErrors'
import FriendAction from './FriendAction'
import PlayerIdentity from '@components/molecules/PlayerIdentity'

/** Characters needed before searching, and delay after the last keystroke (ADR 0008). */
const MIN_QUERY = 2
const DEBOUNCE_MS = 300

/** Answer to one search, kept with the query it answers. */
type SearchOutcome = { query: string } & (
  { kind: 'results'; players: PlayerSearchResult[] } | { kind: 'error'; message: string }
)

type SearchState = { kind: 'idle' } | { kind: 'searching' } | SearchOutcome

/** Player search screen: results while typing, each with a friend request action (ADR 0008). */
export default function PlayerSearch(): React.JSX.Element {
  const { t } = useTranslation()
  const searchPlayers = useSocialStore((s) => s.searchPlayers)
  const [query, setQuery] = usePageState('playerQuery', '')
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null)
  const seq = useRef(0)

  useEffect(() => {
    if (query.trim().length < MIN_QUERY) return
    const current = ++seq.current
    const timer = setTimeout(async () => {
      try {
        const players = await searchPlayers(query)
        if (current === seq.current) setOutcome({ query, kind: 'results', players })
      } catch (err) {
        if (current === seq.current) {
          setOutcome({ query, kind: 'error', message: getSocialErrorMessage(err, t) })
        }
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, searchPlayers, t])

  const state: SearchState =
    query.trim().length < MIN_QUERY
      ? { kind: 'idle' }
      : outcome?.query === query
        ? outcome
        : { kind: 'searching' }
  const resultsRef = useScrollMemory<HTMLDivElement>('scroll:players', state.kind === 'results')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <InputField
        label={t('universe.socialPage.playerSearch.label')}
        value={query}
        onChange={setQuery}
        placeholder={t('universe.socialPage.playerSearch.placeholder')}
      />

      <div className="ds-panel flex-1 min-h-0 overflow-hidden">
        <div ref={resultsRef} className="h-full overflow-y-auto p-3 flex flex-col gap-2">
          {state.kind === 'idle' && (
            <p className="text-sm text-[var(--color-ds-muted)] p-2">
              {t('universe.socialPage.playerSearch.minChars', { count: MIN_QUERY })}
            </p>
          )}
          {state.kind === 'searching' && (
            <p className="text-sm text-[var(--color-ds-muted)] p-2">
              {t('universe.socialPage.playerSearch.searching')}
            </p>
          )}
          {state.kind === 'error' && <p className="text-sm text-red-400 p-2">{state.message}</p>}
          {state.kind === 'results' && state.players.length === 0 && (
            <p className="text-sm text-[var(--color-ds-muted)] p-2">
              {t('universe.socialPage.playerSearch.empty')}
            </p>
          )}
          {state.kind === 'results' &&
            state.players.map((player) => <PlayerResultRow key={player.id} player={player} />)}
        </div>
      </div>
    </div>
  )
}

/** One found player: name (opens their sheet), then the friend action. */
function PlayerResultRow({ player }: { player: PlayerSearchResult }): React.JSX.Element {
  const openPlayer = useNavigationStore((s) => s.openPlayer)
  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
      <PlayerIdentity name={player.name} onOpen={() => openPlayer(player.id)} />
      <FriendAction playerId={player.id} name={player.name} />
    </div>
  )
}
