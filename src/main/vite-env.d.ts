/** Complète ImportMetaEnv pour les URLs API embarquées au build (voir electron-vite / Vite). */
interface ImportMetaEnv {
  readonly VITE_API_BASE_UNIVERSE: string
  readonly VITE_API_BASE_TESTING: string
  /** Base URL des archives jeu (ZIP). Si vide, identique à VITE_API_BASE_*. */
  readonly VITE_GAME_DOWNLOAD_BASE_UNIVERSE: string
  readonly VITE_GAME_DOWNLOAD_BASE_TESTING: string
  /** ZIP env prod (universe) — URLs complètes (prioritaires sur /game/latest-*.zip). */
  readonly VITE_GAME_ZIP_LINUX: string
  readonly VITE_GAME_ZIP_WINDOWS: string
  readonly VITE_GAME_ZIP_DARWIN: string
  /** ZIP env test — URLs complètes (prioritaires sur /game/latest-*.zip). */
  readonly VITE_GAME_ZIP_TESTING_WINDOWS: string
  readonly VITE_GAME_ZIP_TESTING_LINUX: string
  readonly VITE_GAME_ZIP_TESTING_DARWIN: string
  /** URL du dépôt GitHub du launcher (page releases), ex. https://github.com/org/launcher */
  readonly VITE_LAUNCHER_GITHUB_REPO_URL: string
  /** Largeur fenêtre (px), défaut 1200 */
  readonly VITE_WINDOW_WIDTH: string
  /** Hauteur fenêtre (px), défaut 800 */
  readonly VITE_WINDOW_HEIGHT: string
  /** `"true"` pour ouvrir les DevTools au démarrage */
  readonly VITE_ENABLE_DEVTOOLS: string
  /** `"true"` pour niveau de log fichier debug (electron-log) */
  readonly VITE_ELECTRON_ENABLE_LOGGING: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
