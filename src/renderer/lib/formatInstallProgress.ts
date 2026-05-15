import type { TFunction } from 'i18next'
import type { InstallProgressLabel } from '@shared/types/installProgress'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Maps a structured install progress event to a localized label. */
export function formatInstallProgress(t: TFunction, label: InstallProgressLabel | null): string {
  if (!label) return ''

  switch (label.key) {
    case 'connecting':
      return t('installProgress.connecting')
    case 'checkingUpdates':
      return t('installProgress.checkingUpdates')
    case 'downloading':
      return t('installProgress.downloading', {
        downloaded: formatBytes(label.downloaded),
        total: formatBytes(label.total)
      })
    case 'downloadingIndeterminate':
      return t('installProgress.downloadingIndeterminate', {
        downloaded: formatBytes(label.downloaded)
      })
    case 'preparing':
      return t('installProgress.preparing')
    case 'extracting':
      return t('installProgress.extracting', {
        current: label.current,
        total: label.total
      })
    case 'cleaning':
      return t('installProgress.cleaning')
    case 'completeInstall':
      return t('installProgress.completeInstall', { version: label.version })
    case 'completeUpdate':
      return t('installProgress.completeUpdate', { version: label.version })
    default:
      return ''
  }
}
