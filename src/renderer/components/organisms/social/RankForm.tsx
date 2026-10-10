import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import type { OrganisationRank } from '@shared/types/social'
import {
  ORGANISATION_PERMISSIONS,
  rankFormSchema,
  type OrganisationPermission,
  type RankForm as RankFormValues,
  type RankInput
} from '@shared/schemas/social'
import { useCreateRank, useUpdateRank } from '@hooks/social/useSocialActions'
import Button from '@components/atoms/Button'
import InputField from '@components/molecules/InputField'
import { Checkbox } from '@components/ui/checkbox'
import { Field, FieldLabel } from '@components/ui/field'
import { Label } from '@components/ui/label'
import { fieldError } from '@lib/formErrors'
import { getSocialErrorMessage } from '@lib/socialErrors'

type Props = {
  organisationId: string
  /** The rank edited; absent to create one. */
  rank?: OrganisationRank
  /** The player's own rank: a rank they make stays strictly below it. */
  myRank: OrganisationRank
  onDone: () => void
}

const isShown = (permission: string): permission is OrganisationPermission =>
  (ORGANISATION_PERMISSIONS as readonly string[]).includes(permission)

/**
 * Creates or edits a rank (ADR 0021, `manage_ranks`): name, priority (strictly below the
 * player's), the five permissions the launcher shows, default rank. The CEO rank only takes a new
 * name; permissions the launcher does not show (other services') are kept as they are.
 */
export default function RankForm({
  organisationId,
  rank,
  myRank,
  onDone
}: Props): React.JSX.Element {
  const { t } = useTranslation()
  const create = useCreateRank(organisationId)
  const update = useUpdateRank(organisationId)
  const ceo = rank?.isCeo ?? false
  const schema = rankFormSchema.refine((values) => ceo || values.priority < myRank.priority, {
    path: ['priority'],
    message: 'forms.errors.rankPriorityBelow'
  })
  const form = useForm<RankFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: rank?.name ?? '',
      priority: rank?.priority ?? 0,
      permissions: (rank?.permissions ?? []).filter(isShown),
      isDefault: rank?.isDefault ?? false
    },
    mode: 'onChange'
  })
  const { errors, isDirty, isValid, isSubmitting } = form.formState
  const idPrefix = `rank-${rank?.id ?? 'new'}`

  const submit = form.handleSubmit(async (values) => {
    const hidden = (rank?.permissions ?? []).filter((p) => !isShown(p))
    const input: RankInput = ceo
      ? { name: values.name }
      : {
          name: values.name,
          priority: values.priority,
          permissions: [...hidden, ...values.permissions],
          ...(values.isDefault !== (rank?.isDefault ?? false)
            ? { isDefault: values.isDefault }
            : {})
        }
    try {
      if (rank) await update.mutateAsync({ rankId: rank.id, rank: input })
      else await create.mutateAsync(input)
      onDone()
    } catch (err) {
      form.setError('root.server', { message: getSocialErrorMessage(err, t) })
    }
  })

  return (
    <form
      className="flex flex-col gap-4 rounded-lg border border-[var(--color-ds-border)] p-4"
      onSubmit={submit}
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <InputField
              label={t('universe.socialPage.manage.ranks.name')}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={32}
              disabled={isSubmitting}
              error={fieldError(fieldState, t)}
            />
          )}
        />
        <Controller
          control={form.control}
          name="priority"
          render={({ field, fieldState }) => (
            <InputField
              label={t('universe.socialPage.manage.ranks.priority')}
              name={field.name}
              value={Number.isNaN(field.value) ? '' : String(field.value)}
              onChange={(value) => field.onChange(value.trim() === '' ? NaN : Number(value))}
              onBlur={field.onBlur}
              maxLength={2}
              disabled={isSubmitting || ceo}
              error={fieldError(fieldState, t)}
            />
          )}
        />
      </div>
      {!ceo && (
        <Controller
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <Field>
              <FieldLabel id={`${idPrefix}-permissions`}>
                {t('universe.socialPage.manage.ranks.permissions')}
              </FieldLabel>
              <div
                role="group"
                aria-labelledby={`${idPrefix}-permissions`}
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {ORGANISATION_PERMISSIONS.map((permission) => (
                  <div key={permission} className="flex items-center gap-2">
                    <Checkbox
                      id={`${idPrefix}-${permission}`}
                      checked={field.value.includes(permission)}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) =>
                        field.onChange(
                          checked
                            ? [...field.value, permission]
                            : field.value.filter((p) => p !== permission)
                        )
                      }
                    />
                    <Label htmlFor={`${idPrefix}-${permission}`}>
                      {t(`universe.socialPage.manage.permissions.${permission}`)}
                    </Label>
                  </div>
                ))}
              </div>
            </Field>
          )}
        />
      )}
      {!ceo && (
        <Controller
          control={form.control}
          name="isDefault"
          render={({ field }) => (
            <div className="flex items-center gap-2">
              <Checkbox
                id={`${idPrefix}-default`}
                checked={field.value}
                // The default rank stays one until another takes its place
                disabled={isSubmitting || (rank?.isDefault ?? false)}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              <Label htmlFor={`${idPrefix}-default`}>
                {t('universe.socialPage.manage.ranks.default')}
              </Label>
            </div>
          )}
        />
      )}
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-400">
          {errors.root.server.message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={(rank !== undefined && !isDirty) || !isValid}
          loading={isSubmitting}
        >
          {rank ? t('universe.socialPage.profileEdit.save') : t('common.create')}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
