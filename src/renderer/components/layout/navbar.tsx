import i18n from '@renderer/i18n'
import { useEnvStore } from '@store/env'
import { useNavigationStore } from '@store/navigation'
import type { View } from '@store/navigation'
import { useTranslation } from 'react-i18next'

export default function Navbar(): React.JSX.Element {
  const { activeEnv, setEnv } = useEnvStore()
  const { currentView, navigate } = useNavigationStore()
  const { t } = useTranslation()

  const handleEnvSwitch = (env: 'universe' | 'universe-testing'): void => {
    setEnv(env)
    navigate(env)
  }

  const navLinks: { label: string; view: View }[] = [
    { label: t("navbar.social"), view: 'social' },
    { label: t("navbar.lore"), view: 'lore'   }
  ]

  return (
    <nav className="flex items-center justify-between px-6 h-14 bg-[var(--color-ds-surface)] border-b border-[var(--color-ds-border)] shrink-0">

      {/* Gauche : logo + onglets environnement */}
      <div className="flex items-center gap-6">
        <span className="font-bold text-[var(--color-ds-accent)] text-lg tracking-wider select-none">
          ✦ DYING STAR
        </span>

        <div className="flex gap-1">
          {(['universe', 'universe-testing'] as const).map((env) => (
            <button
              key={env}
              onClick={() => handleEnvSwitch(env)}
              className={[
                'px-4 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer',
                activeEnv === env
                  ? 'bg-[var(--color-ds-accent)] text-white'
                  : 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] hover:bg-white/5'
              ].join(' ')}
            >
              {env === 'universe' ? 'Universe' : 'Universe Testing'}
            </button>
          ))}
        </div>

        {/* Liens vues secondaires */}
        <div className="flex gap-1">
          {navLinks.map(({ label, view }) => (
            <button
              key={view}
              onClick={() => navigate(view)}
              className={[
                'px-3 py-1.5 rounded text-sm transition-colors cursor-pointer',
                currentView === view
                  ? 'text-[var(--color-ds-text)] bg-white/10'
                  : 'text-[var(--color-ds-muted)] hover:text-[var(--color-ds-text)] hover:bg-white/5'
              ].join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Droite : liens externes + don */}
      <div className="flex items-center gap-4 text-sm text-[var(--color-ds-muted)]">
      <button 
          onClick={() => i18n.changeLanguage("en")}
          className="hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
        >
          EN
        </button>
        <button 
          onClick={() => i18n.changeLanguage("fr")}
          className="hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
        >
          FR
        </button>
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--color-ds-muted)]">
        <button
          onClick={() => window.open('https://dyingstar.example.com', '_blank')}
          className="hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
          title="Site"
        >
          🌐 Site
        </button>
        <button
          onClick={() => window.open('https://discord.gg/dyingstar', '_blank')}
          className="hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
          title="Discord"
        >
          💬 Discord
        </button>
        <button
          onClick={() => window.open('https://wiki.dyingstar.example.com', '_blank')}
          className="hover:text-[var(--color-ds-text)] transition-colors cursor-pointer"
          title="Wiki"
        >
          📖 Wiki
        </button>
        <button
          onClick={() => window.open('https://dyingstar.example.com/donate', '_blank')}
          className="px-3 py-1.5 rounded bg-[var(--color-ds-accent)]/20 text-[var(--color-ds-accent)] hover:bg-[var(--color-ds-accent)]/40 transition-colors cursor-pointer text-xs font-medium"
        >
          ❤ Soutenir
        </button>
      </div>
    </nav>
  )
}