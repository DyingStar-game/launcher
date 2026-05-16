/** i18next instance: FR/EN translations for the renderer. */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../i18n/en.json'
import fr from '../i18n/fr.json'

const STORAGE_KEY = 'ds-language'

function detectLanguage(): 'en' | 'fr' {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'fr') return stored
  }
  if (typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr')) {
    return 'fr'
  }
  return 'en'
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr }
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false
  }
})

i18n.on('languageChanged', (lng) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, lng)
  }
})

export default i18n
