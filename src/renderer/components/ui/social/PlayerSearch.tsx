import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PlayerRelation, PlayerSearchResult } from '@shared/types/social'
import { useEnvStore } from '@stores/env'
import { useSocialStore } from '@stores/social'
import InputField from '@components/ui/primitives/InputField'
import { getSocialErrorMessage } from '@lib/socialErrors'
import { playerRelation } from '@lib/playerRelation'

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
  const { activeEnv } = useEnvStore()
  const { data, searchPlayers } = useSocialStore()
  const social = data[activeEnv]
  const [query, setQuery] = useState('')
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

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <InputField
        label={t('universe.socialPage.playerSearch.label')}
        value={query}
        onChange={setQuery}
        placeholder={t('universe.socialPage.playerSearch.placeholder')}
      />

      <div className="ds-panel flex-1 min-h-0 overflow-hidden">
        <div className="h-full overflow-y-auto p-3 flex flex-col gap-2">
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
            state.players.map((player) => (
              <PlayerResultRow
                key={player.id}
                player={player}
                relation={playerRelation(player.id, social)}
              />
            ))}
        </div>
      </div>
    </div>
  )
}

/** One found player: name, then a badge or the action matching their relation to the player. */
function PlayerResultRow({
  player,
  relation
}: {
  player: PlayerSearchResult
  relation: PlayerRelation
}): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, sendFriendRequest, acceptRequest } = useSocialStore()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const run = async (action: () => Promise<unknown>): Promise<void> => {
    setStatus('loading')
    setErrorMsg('')
    try {
      await action()
      // The store reloads: the relation, hence the badge, follows
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  const handleAdd = (): Promise<void> => run(() => sendFriendRequest(player.id))
  const handleAccept = (): Promise<void> => {
    const request = data[activeEnv].incoming.find((r) => r.playerId === player.id)
    return run(async () => {
      if (request) await acceptRequest(request.id)
    })
  }

  const badge =
    relation === 'self'
      ? t('universe.socialPage.playerSearch.you')
      : relation === 'friend'
        ? t('universe.socialPage.playerSearch.friend')
        : relation === 'outgoing'
          ? t('universe.socialPage.playerSearch.requestSent')
          : null

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
      <div className="w-8 h-8 shrink-0 rounded-full bg-[var(--color-ds-border)] flex items-center justify-center">
        <span className="text-xs font-semibold text-[var(--color-ds-muted)] select-none uppercase">
          {player.name[0]}
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <span className="text-sm font-medium text-[var(--color-ds-text)] truncate">
          {player.name}
        </span>
        {status === 'error' && <span className="text-xs text-red-400 mt-0.5">{errorMsg}</span>}
      </div>

      {badge ? (
        <span className="shrink-0 px-2.5 py-1 rounded-lg border border-[var(--color-ds-border)] text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.15em]">
          {badge}
        </span>
      ) : (
        <button
          onClick={relation === 'incoming' ? handleAccept : handleAdd}
          disabled={status === 'loading'}
          aria-label={
            relation === 'incoming'
              ? t('universe.socialPage.request.acceptAria', { name: player.name })
              : t('universe.socialPage.playerSearch.addAria', { name: player.name })
          }
          className="
            shrink-0 inline-flex items-center gap-1.5
            px-2.5 py-1 rounded-lg
            border border-[var(--color-ds-border)]
            text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.15em]
            hover:border-[var(--color-ds-accent)]/60 hover:text-[var(--color-ds-text)] hover:bg-white/4
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {status === 'loading'
            ? '...'
            : relation === 'incoming'
              ? t('universe.socialPage.accept')
              : t('universe.socialPage.playerSearch.add')}
        </button>
      )}
    </div>
  )
}
