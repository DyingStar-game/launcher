import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { PlayerProfile } from '@shared/types/social'
import {
  profileFormSchema,
  profileLimits,
  toProfilePatch,
  type ProfileForm
} from '@shared/schemas/social'
import { useUpdateProfile } from '@hooks/social/useSocialActions'
import Button from '@components/atoms/Button'
import InputField from '@components/molecules/InputField'
import SheetSection from '@components/molecules/SheetSection'
import RichTextField from '@components/molecules/RichTextField'
import { fieldError } from '@lib/formErrors'
import { getSocialErrorMessage } from '@lib/socialErrors'

export type ProfileEditFormProps = {
  profile: PlayerProfile
  /** Leaves the form: after saving, or on Cancel. */
  onDone: () => void
}

/** Form values of a loaded profile: absent texts are empty. */
function toForm(profile: PlayerProfile): ProfileForm {
  return {
    faction: profile.faction ?? '',
    biography: profile.biography ?? '',
    characterName: profile.characterName ?? '',
    alignment: profile.alignment ?? '',
    story: profile.story ?? ''
  }
}

const SHORT_FIELDS = ['faction'] as const
const SHEET_SHORT_FIELDS = ['characterName', 'alignment'] as const

/**
 * The player's own profile texts (ADR 0020): faction, biography, role-play sheet. React Hook
 * Form with the shared schema (ADR 0022); only what changed is sent.
 */
export default function ProfileEditForm({
  profile,
  onDone
}: ProfileEditFormProps): React.JSX.Element {
  const { t } = useTranslation()
  const updateProfile = useUpdateProfile()
  const initial = toForm(profile)
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initial,
    mode: 'onChange'
  })
  const { errors, isDirty, isValid, isSubmitting } = form.formState
  const label = (field: keyof ProfileForm): string => t(`universe.socialPage.profileEdit.${field}`)

  const submit = form.handleSubmit(async (values) => {
    const patch = toProfilePatch(initial, values)
    if (Object.keys(patch).length === 0) return onDone()
    try {
      await updateProfile.mutateAsync(patch)
      toast.success(t('universe.socialPage.profileEdit.saved'))
      onDone()
    } catch (err) {
      form.setError('root.server', { message: getSocialErrorMessage(err, t) })
    }
  })

  const input = (field: keyof ProfileForm): React.JSX.Element => (
    <Controller
      key={field}
      control={form.control}
      name={field}
      render={({ field: f, fieldState }) => (
        <InputField
          label={label(field)}
          name={f.name}
          value={f.value}
          onChange={f.onChange}
          onBlur={f.onBlur}
          maxLength={profileLimits[field]}
          disabled={isSubmitting}
          error={fieldError(fieldState, t)}
        />
      )}
    />
  )

  const textarea = (field: 'biography' | 'story'): React.JSX.Element => (
    <Controller
      control={form.control}
      name={field}
      render={({ field: f, fieldState }) => (
        <RichTextField
          label={label(field)}
          value={f.value}
          onChange={f.onChange}
          onBlur={f.onBlur}
          maxLength={profileLimits[field]}
          disabled={isSubmitting}
          error={fieldError(fieldState, t)}
        />
      )}
    />
  )

  return (
    <form className="flex flex-col gap-6" onSubmit={submit} noValidate>
      <SheetSection title={t('universe.socialPage.profileEdit.about')}>
        <div className="flex flex-col gap-4">
          {SHORT_FIELDS.map(input)}
          {textarea('biography')}
        </div>
      </SheetSection>
      <SheetSection title={t('universe.socialPage.profileEdit.rpSheet')}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SHEET_SHORT_FIELDS.map(input)}
          </div>
          {textarea('story')}
        </div>
      </SheetSection>
      {errors.root?.server && (
        <p role="alert" className="text-sm text-red-400">
          {errors.root.server.message}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={!isDirty || !isValid}
          loading={isSubmitting}
        >
          {t('universe.socialPage.profileEdit.save')}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
      </div>
    </form>
  )
}
