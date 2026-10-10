import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useEnvStore } from '@stores/env'
import { useSocialStore } from '@stores/social'
import InputField from '@components/molecules/InputField'

/** Search box for the organisation directory (name or ticker). */
export default function OrganisationSearch(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeEnv } = useEnvStore()
  const { data, searchOrgas } = useSocialStore()
  const [search, setSearch] = useState(data[activeEnv].orgaSearch)

  return (
    <InputField
      label={t('universe.socialPage.orgaSearch.label')}
      value={search}
      onChange={setSearch}
      placeholder={t('universe.socialPage.orgaSearch.placeholder')}
      action={{
        label: t('universe.socialPage.orgaSearch.action'),
        onClick: () => void searchOrgas(search)
      }}
    />
  )
}
