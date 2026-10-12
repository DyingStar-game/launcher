import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useCreateOrganisation } from '@hooks/social/useSocialActions'
import {
  createOrganisationSchema,
  type CreateOrganisation,
  type CreateOrganisationInput
} from '@shared/schemas/social'
import Button from '@components/atoms/Button'
import Panel from '@components/atoms/Panel'
import InputField from '@components/molecules/InputField'
import { toast } from 'sonner'
import { fieldError } from '@lib/formErrors'
import { getSocialErrorMessage } from '@lib/socialErrors'

export type CreateOrganisationFormProps = {
  onClose: () => void
}

/** Inline form to create a new organization (React Hook Form, ADR 0022). */
export default function CreateOrganisationForm({
  onClose
}: CreateOrganisationFormProps): React.JSX.Element {
  const { t } = useTranslation()
  const createOrga = useCreateOrganisation().mutateAsync
  const form = useForm<CreateOrganisationInput, unknown, CreateOrganisation>({
    resolver: zodResolver(createOrganisationSchema),
    defaultValues: { name: '', ticker: '' },
    mode: 'onChange'
  })
  const { errors, isValid, isSubmitting } = form.formState

  const submit = form.handleSubmit(async (input) => {
    try {
      await createOrga(input)
      toast.success(t('universe.socialPage.createOrgaForm.success'))
      onClose()
    } catch (err) {
      form.setError('root.server', { message: getSocialErrorMessage(err, t) })
    }
  })

  return (
    <Panel variant="card" asChild className="flex flex-col gap-3 p-4">
      <form onSubmit={submit} noValidate>
        <p className="text-2xs font-semibold text-ds-muted uppercase tracking-[0.2em]">
          {t('universe.socialPage.createOrgaForm.title')}
        </p>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <InputField
              label={t('universe.socialPage.createOrgaForm.nameLabel')}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={48}
              placeholder={t('universe.socialPage.createOrgaForm.namePlaceholder')}
              disabled={isSubmitting}
              error={fieldError(fieldState, t)}
            />
          )}
        />
        <Controller
          control={form.control}
          name="ticker"
          render={({ field, fieldState }) => (
            <InputField
              label={t('universe.socialPage.createOrgaForm.tickerLabel')}
              name={field.name}
              value={field.value}
              onChange={(value) => field.onChange(value.toUpperCase())}
              onBlur={field.onBlur}
              maxLength={5}
              placeholder={t('universe.socialPage.createOrgaForm.tickerPlaceholder')}
              disabled={isSubmitting}
              error={fieldError(fieldState, t)}
            />
          )}
        />
        {errors.root?.server && (
          <p className="text-xs text-red-400">{errors.root.server.message}</p>
        )}
        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={!isValid} loading={isSubmitting}>
            {t('common.create')}
          </Button>
          <Button variant="link" size="none" onClick={onClose}>
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
