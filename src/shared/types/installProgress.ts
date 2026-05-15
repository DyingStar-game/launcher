/** Install/download progress label sent from main → renderer (translated in UI). */
export type InstallProgressLabel =
  | { key: 'connecting' }
  | { key: 'checkingUpdates' }
  | { key: 'downloading'; downloaded: number; total: number }
  | { key: 'downloadingIndeterminate'; downloaded: number }
  | { key: 'preparing' }
  | { key: 'extracting'; current: number; total: number }
  | { key: 'cleaning' }
  | { key: 'completeInstall'; version: string }
  | { key: 'completeUpdate'; version: string }
