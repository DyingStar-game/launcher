/** Variables d'environnement Vite (main + renderer). */
interface ImportMetaEnv {
  readonly VITE_API_BASE_UNIVERSE: string
  readonly VITE_API_BASE_TESTING: string
  readonly VITE_GAME_DOWNLOAD_BASE_UNIVERSE: string
  readonly VITE_GAME_DOWNLOAD_BASE_TESTING: string
  readonly VITE_GAME_ZIP_LINUX: string
  readonly VITE_GAME_ZIP_WINDOWS: string
  readonly VITE_GAME_ZIP_DARWIN: string
  readonly VITE_GAME_ZIP_TESTING_WINDOWS: string
  readonly VITE_GAME_ZIP_TESTING_LINUX: string
  readonly VITE_GAME_ZIP_TESTING_DARWIN: string
  readonly VITE_LAUNCHER_GITHUB_REPO_URL: string
  readonly VITE_LAUNCHER_RELEASE_DISCORD_URL: string
  readonly VITE_WINDOW_WIDTH: string
  readonly VITE_WINDOW_HEIGHT: string
  readonly VITE_ENABLE_DEVTOOLS: string
  readonly VITE_ELECTRON_ENABLE_LOGGING: string
  readonly VITE_STATUS_COMPONENT_ID_UNIVERSE: string
  readonly VITE_STATUS_COMPONENT_ID_TESTING: string
  readonly VITE_STATUS_METRIC_ID_UNIVERSE: string
  readonly VITE_STATUS_METRIC_ID_TESTING: string
  readonly VITE_STATUS_PAGE_UNIVERSE: string
  readonly VITE_STATUS_PAGE_TESTING: string
  readonly VITE_SERVER_STATUS_POLL_MINUTES: string
  readonly VITE_NAV_WEBSITE_URL: string
  readonly VITE_NAV_DISCORD_URL: string
  readonly VITE_NAV_WIKI_URL: string
  readonly VITE_NAV_DONATE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
