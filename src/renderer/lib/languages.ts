/** UI languages offered in the language menus, with their label key (translated in the UI language). */
export const LANGUAGES = [
  { code: 'en', labelKey: 'navbar.languageEn' },
  { code: 'fr', labelKey: 'navbar.languageFr' }
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

/** The offered language matching i18next's resolved language (English by default). */
export function currentLanguage(i18n: {
  resolvedLanguage?: string
  language: string
}): LanguageCode {
  return (i18n.resolvedLanguage ?? i18n.language).startsWith('fr') ? 'fr' : 'en'
}
