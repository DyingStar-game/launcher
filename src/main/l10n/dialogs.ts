import { app } from 'electron'

type InstallDialogStrings = {
  selectDirectoryTitle: string
  selectDirectoryButton: string
}

const DIALOGS: Record<'en' | 'fr', InstallDialogStrings> = {
  en: {
    selectDirectoryTitle: 'Installation directory',
    selectDirectoryButton: 'Select folder'
  },
  fr: {
    selectDirectoryTitle: "Répertoire d'installation",
    selectDirectoryButton: 'Choisir le dossier'
  }
}

function resolveLocale(): 'en' | 'fr' {
  const locale = app.getLocale().toLowerCase()
  return locale.startsWith('fr') ? 'fr' : 'en'
}

/** Native open-dialog strings aligned with the OS locale (fr/en). */
export function getInstallDialogStrings(): InstallDialogStrings {
  return DIALOGS[resolveLocale()]
}
