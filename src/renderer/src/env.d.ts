/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Page de statut (prod). Vide tant que non défini → bouton désactivé. */
  readonly VITE_STATUS_PAGE_UNIVERSE: string
  /** Page de statut (test / preprod). */
  readonly VITE_STATUS_PAGE_TESTING: string
  /** Intervalle de rafraîchissement statut serveur + joueurs (minutes). Défaut 5. */
  readonly VITE_SERVER_STATUS_POLL_MINUTES: string
  /** Lien Discord où récupérer la nouvelle version du launcher (bandeau mise à jour). */
  readonly VITE_LAUNCHER_RELEASE_DISCORD_URL: string
  /** Liens barre de navigation (vide → bouton désactivé). */
  readonly VITE_NAV_WEBSITE_URL: string
  readonly VITE_NAV_DISCORD_URL: string
  readonly VITE_NAV_WIKI_URL: string
  readonly VITE_NAV_DONATE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}