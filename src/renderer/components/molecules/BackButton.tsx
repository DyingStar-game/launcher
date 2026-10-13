import { useTranslation } from 'react-i18next'
import Button from '@components/atoms/Button'

export type BackButtonProps = { onBack: () => void }

/** "← Back" button at the top of a detail page. */
export default function BackButton({ onBack }: BackButtonProps): React.JSX.Element {
  const { t } = useTranslation()
  return (
    <Button variant="ghost" size="sm" onClick={onBack}>
      ← {t('common.back')}
    </Button>
  )
}
