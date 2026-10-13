import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { OrganisationProfile } from '@shared/types/social'
import {
  RECRUITMENT_MODES,
  organisationDetailsFormSchema,
  toOrganisationPatch,
  type OrganisationDetails,
  type OrganisationDetailsInput
} from '@shared/schemas/social'
import { useUpdateOrganisation } from '@hooks/social/useSocialActions'
import Button from '@components/atoms/Button'
import InputField from '@components/molecules/InputField'
import RichTextField from '@components/molecules/RichTextField'
import { Field, FieldLabel } from '@components/ui/field'
import { Label } from '@components/ui/label'
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group'
import { fieldError } from '@lib/formErrors'
import { getSocialErrorMessage } from '@lib/socialErrors'

/** Form values of a loaded organisation: no description is an empty one. */
function toForm(organisation: OrganisationProfile): OrganisationDetails {
  return {
    name: organisation.name,
    ticker: organisation.ticker,
    description: organisation.description ?? '',
    recruitment: organisation.recruitment
  }
}

export type OrganisationDetailsFormProps = {
  organisation: OrganisationProfile
}

/**
 * An organisation's details (ADR 0021, `manage_corporation`): name, tag, description (WYSIWYG,
 * ADR 0030) and recruitment. Only what changed is sent; the form stays, saved.
 */
export default function OrganisationDetailsForm({
  organisation
}: OrganisationDetailsFormProps): React.JSX.Element {
  const { t } = useTranslation()
  const update = useUpdateOrganisation(organisation.id)
  const initial = toForm(organisation)
  const form = useForm<OrganisationDetailsInput, unknown, OrganisationDetails>({
    resolver: zodResolver(organisationDetailsFormSchema),
    defaultValues: initial,
    mode: 'onChange'
  })
  const { errors, isDirty, isValid, isSubmitting } = form.formState
  const recruitmentId = `${organisation.id}-recruitment`

  const submit = form.handleSubmit(async (values) => {
    try {
      await update.mutateAsync(toOrganisationPatch(initial, values))
      form.reset(values)
      toast.success(t('universe.socialPage.manage.saved'))
    } catch (err) {
      form.setError('root.server', { message: getSocialErrorMessage(err, t) })
    }
  })

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <InputField
              label={t('universe.socialPage.manage.details.name')}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              maxLength={48}
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
              label={t('universe.socialPage.manage.details.ticker')}
              name={field.name}
              value={field.value}
              onChange={(value) => field.onChange(value.toUpperCase())}
              onBlur={field.onBlur}
              maxLength={5}
              disabled={isSubmitting}
              error={fieldError(fieldState, t)}
            />
          )}
        />
      </div>
      <Controller
        control={form.control}
        name="description"
        render={({ field, fieldState }) => (
          <RichTextField
            label={t('universe.socialPage.manage.details.description')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            maxLength={2000}
            disabled={isSubmitting}
            error={fieldError(fieldState, t)}
          />
        )}
      />
      <Controller
        control={form.control}
        name="recruitment"
        render={({ field }) => (
          <Field>
            <FieldLabel id={recruitmentId}>
              {t('universe.socialPage.manage.details.recruitment')}
            </FieldLabel>
            <RadioGroup
              aria-labelledby={recruitmentId}
              value={field.value}
              onValueChange={field.onChange}
              disabled={isSubmitting}
            >
              {RECRUITMENT_MODES.map((mode) => (
                <div key={mode} className="flex items-center gap-2">
                  <RadioGroupItem id={`${recruitmentId}-${mode}`} value={mode} />
                  <Label htmlFor={`${recruitmentId}-${mode}`}>
                    {t(`universe.socialPage.organisation.recruitment.${mode}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Field>
        )}
      />
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-400">
          {errors.root.server.message}
        </p>
      )}
      <div>
        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty || !isValid}
          loading={isSubmitting}
        >
          {t('universe.socialPage.profileEdit.save')}
        </Button>
      </div>
    </form>
  )
}
