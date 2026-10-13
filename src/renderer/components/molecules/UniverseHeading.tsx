import { useTranslation } from 'react-i18next'

export type UniverseHeadingProps = {
  /** The universe's name. */
  name: string
  /** One line about the universe, under its name. */
  tagline?: string
  /** Installed game version, when installed. */
  version?: string
  /** Its release date, already formatted. */
  releaseDate?: string
}

/** The universe's name, large, with its tagline and the installed game version under it. */
export default function UniverseHeading({
  name,
  tagline,
  version,
  releaseDate
}: UniverseHeadingProps): React.JSX.Element {
  const { t } = useTranslation()

  return (
    // The shadow keeps the text readable over the key art
    <div className="flex flex-col gap-1.5 text-shadow-md">
      <h1 className="text-6xl leading-none font-bold text-ds-text">{name}</h1>
      {tagline && <p className="text-base text-white/80">{tagline}</p>}
      {version && (
        <p className="mt-1.5 flex gap-4 font-mono text-xs text-white/65">
          <span>{t('universe.hero.version', { version })}</span>
          {releaseDate && <span>{t('universe.hero.release', { date: releaseDate })}</span>}
        </p>
      )}
    </div>
  )
}
