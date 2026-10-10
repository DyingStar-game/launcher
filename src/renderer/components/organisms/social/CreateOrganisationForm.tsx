import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSocialStore } from '@stores/social'
import InputField from '@components/molecules/InputField'
import { socialPanelAutoCloseMs } from '@lib/env'
import { getSocialErrorMessage } from '@lib/socialErrors'

/** Inline form to create a new organization. */
export default function CreateOrganisationForm({
  onClose
}: {
  onClose: () => void
}): React.JSX.Element {
  const { t } = useTranslation()
  const { createOrga } = useSocialStore()
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (): Promise<void> => {
    if (!name.trim() || !ticker.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await createOrga(name, ticker)
      setStatus('success')
      setName('')
      setTicker('')
      setTimeout(onClose, socialPanelAutoCloseMs())
    } catch (err) {
      setStatus('error')
      setErrorMsg(getSocialErrorMessage(err, t))
    }
  }

  return (
    <div className="ds-card flex flex-col gap-3 p-4">
      <p className="text-[10px] font-semibold text-[var(--color-ds-muted)] uppercase tracking-[0.2em]">
        {t('universe.socialPage.createOrgaForm.title')}
      </p>
      <InputField
        label={t('universe.socialPage.createOrgaForm.nameLabel')}
        value={name}
        onChange={setName}
        placeholder={t('universe.socialPage.createOrgaForm.namePlaceholder')}
        disabled={status === 'loading'}
      />
      <InputField
        label={t('universe.socialPage.createOrgaForm.tickerLabel')}
        value={ticker}
        onChange={(value) => setTicker(value.toUpperCase().slice(0, 5))}
        placeholder={t('universe.socialPage.createOrgaForm.tickerPlaceholder')}
        disabled={status === 'loading'}
        action={{
          label: status === 'loading' ? t('common.loading') : t('common.create'),
          onClick: handleSubmit
        }}
      />
      {status === 'success' && (
        <p className="text-xs text-emerald-400">
          {t('universe.socialPage.createOrgaForm.success')}
        </p>
      )}
      {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
      <button
        onClick={onClose}
        className="text-xs text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] transition-colors text-left"
      >
        {t('common.cancel')}
      </button>
    </div>
  )
}
