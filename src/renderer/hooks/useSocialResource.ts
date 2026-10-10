import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Subject } from '@stores/navigation'
import { getSocialErrorMessage } from '@lib/socialErrors'

/** State of a resource loaded for a subject (ADR 0012). */
export type ResourceState<T> =
  { kind: 'loading' } | { kind: 'loaded'; data: T } | { kind: 'error'; message: string }

type Outcome<T> = { subject: Subject } & (
  { kind: 'loaded'; data: T } | { kind: 'error'; message: string }
)

/**
 * Loads a social resource (player, organisation) for a subject; while the answer for the
 * current subject has not arrived, the state is `loading` — a late answer for a previous subject
 * is ignored. Errors come back translated.
 */
export function useSocialResource<T>(
  subject: Subject | null,
  load: (env: Subject['env'], id: string) => Promise<T>
): ResourceState<T> {
  const { t } = useTranslation()
  const [outcome, setOutcome] = useState<Outcome<T> | null>(null)

  useEffect(() => {
    if (!subject) return
    let cancelled = false
    load(subject.env, subject.id).then(
      (data) => !cancelled && setOutcome({ subject, kind: 'loaded', data }),
      (err) =>
        !cancelled && setOutcome({ subject, kind: 'error', message: getSocialErrorMessage(err, t) })
    )
    return () => {
      cancelled = true
    }
  }, [subject, load, t])

  if (!outcome || outcome.subject !== subject) return { kind: 'loading' }
  return outcome.kind === 'loaded'
    ? { kind: 'loaded', data: outcome.data }
    : { kind: 'error', message: outcome.message }
}
