import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OrganisationProfile } from '@shared/types/social'
import type { Subject } from '@stores/navigation'
import { useNavigationStore } from '@stores/navigation'
import { useOrganisationMembers } from '@hooks/social/useSocialSheets'
import { useDisbandOrganisation, useTransferOrganisation } from '@hooks/social/useSocialActions'
import Button from '@components/atoms/Button'
import ConfirmDialog from '@components/molecules/ConfirmDialog'
import InputField from '@components/molecules/InputField'
import SheetSection from '@components/molecules/SheetSection'
import { Field, FieldLabel } from '@components/ui/field'
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group'
import { Label } from '@components/ui/label'

export type OrganisationLeadershipProps = {
  subject: Subject
  organisation: OrganisationProfile
  selfId: string
}

/**
 * The CEO's actions (ADR 0021): hand the leadership to a member, or disband the organisation —
 * typing its tag to confirm. After disbanding, the player goes back to the social page.
 */
export default function OrganisationLeadership({
  subject,
  organisation,
  selfId
}: OrganisationLeadershipProps): React.JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigationStore((s) => s.navigate)
  const { members } = useOrganisationMembers(subject)
  const transfer = useTransferOrganisation(subject.id)
  const disband = useDisbandOrganisation(subject.id)
  const [heir, setHeir] = useState('')
  const [typedTag, setTypedTag] = useState('')
  const candidates = members.filter((m) => m.id !== selfId)
  const heirName = candidates.find((m) => m.id === heir)?.name ?? ''
  const heirsId = `${subject.id}-heirs`

  return (
    <div className="flex flex-col gap-6">
      <SheetSection title={t('universe.socialPage.manage.leadership.transfer')}>
        {candidates.length === 0 ? (
          <p className="text-sm text-ds-muted">
            {t('universe.socialPage.manage.leadership.noMember')}
          </p>
        ) : (
          <Field>
            <FieldLabel id={heirsId}>{t('universe.socialPage.manage.leadership.heir')}</FieldLabel>
            <RadioGroup aria-labelledby={heirsId} value={heir} onValueChange={setHeir}>
              {candidates.map((member) => (
                <div key={member.id} className="flex items-center gap-2">
                  <RadioGroupItem id={`${heirsId}-${member.id}`} value={member.id} />
                  <Label htmlFor={`${heirsId}-${member.id}`}>
                    {member.name} <span className="font-normal text-ds-muted">{member.rank}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </Field>
        )}
        <div>
          <ConfirmDialog
            trigger={
              <Button variant="outline" disabled={!heir}>
                {t('universe.socialPage.manage.leadership.transfer')}
              </Button>
            }
            title={t('universe.socialPage.manage.leadership.transferTitle', { name: heirName })}
            description={t('universe.socialPage.manage.leadership.transferDescription')}
            confirmLabel={t('universe.socialPage.manage.leadership.transfer')}
            onConfirm={() => transfer.mutateAsync(heir)}
          />
        </div>
      </SheetSection>

      <SheetSection title={t('universe.socialPage.manage.leadership.disband')}>
        <p className="text-sm text-ds-muted">
          {t('universe.socialPage.manage.leadership.disbandDescription')}
        </p>
        <div>
          <ConfirmDialog
            trigger={
              <Button variant="danger">{t('universe.socialPage.manage.leadership.disband')}</Button>
            }
            title={t('universe.socialPage.manage.leadership.disbandTitle', {
              name: organisation.name
            })}
            description={t('universe.socialPage.manage.leadership.disbandDescription')}
            confirmLabel={t('universe.socialPage.manage.leadership.disband')}
            confirmDisabled={typedTag.trim().toUpperCase() !== organisation.ticker}
            onConfirm={async () => {
              await disband.mutateAsync()
              navigate('social')
            }}
          >
            <InputField
              label={t('universe.socialPage.manage.leadership.typeTag', {
                ticker: organisation.ticker
              })}
              value={typedTag}
              onChange={setTypedTag}
              maxLength={5}
            />
          </ConfirmDialog>
        </div>
      </SheetSection>
    </div>
  )
}
