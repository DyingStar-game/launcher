import { ElectronAPI } from '@electron-toolkit/preload'
import type { Env } from '../renderer/store/env'

type ServerStatus = 'online' | 'offline' | 'degraded' | 'checking'

interface ServerStatusResult {
  status: ServerStatus
  players: number
  statusPageUrl: string
}
 
interface InstallResult {
  version: string
  releaseDate: string
}
 
interface VersionCheckResult {
  currentLauncherVersion: string
  latestLauncherVersion: string
  launcherUpdateAvailable: boolean
  latestGameVersions: Record<Env, string | null>
}

interface UserInfo {
  sub: string
  username: string
  email: string
}

type AuthStateChangedPayload =
  | { status: 'connected'; user: UserInfo }
  | { status: 'error'; error: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // ── Fichiers / Installation ────────────────────────────────────────────

      /** Ouvre un dialogue natif de sélection de répertoire. */
      selectDirectory: () => Promise<string | null>

      /** Lance le téléchargement et l'installation du jeu. */
      installGame: (env: Env, installPath: string) => Promise<void>

      /** S'abonne aux événements de progression de l'installation (0–100). */
      onInstallProgress: (callback: (progress: number, label: string) => void) => void

      // ── Jeu ───────────────────────────────────────────────────────────────

      /** Lance l'exécutable du jeu (détaché du launcher). */
      launchGame: (env: Env, installPath: string) => Promise<void>

      /** Récupère le statut du serveur et le nombre de joueurs connectés. */
      getServerStatus: (env: Env) => Promise<ServerStatusResult>

      // ── Versions ─────────────────────────────────────────────────────────
      checkVersions: () => Promise<VersionCheckResult>

      // ── Auth ─────────────────────────────────────────────────────────────

      /** Ouvre le navigateur sur la page Discord/Keycloak (login et création de compte). */
      authLogin: () => Promise<void>

      /** Efface les tokens locaux et ouvre la page de déconnexion Keycloak. */
      authLogout: () => Promise<void>

      /** Recharge la session depuis le stockage chiffré. Retourne null si aucune session valide. */
      authLoadUser: () => Promise<UserInfo | null>

      /** S'abonne aux changements d'état d'authentification poussés depuis le main. */
      onAuthStateChanged: (callback: (data: AuthStateChangedPayload) => void) => void
    }
  }
}