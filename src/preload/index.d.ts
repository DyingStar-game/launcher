import { ElectronAPI } from '@electron-toolkit/preload'
import type { Env } from '../renderer/store/env'

type ServerStatusValue = 'online' | 'degraded' | 'offline' | 'maintenance' | 'unknown' | 'unavailable'

interface ServerStatusResult {
  status:    ServerStatusValue
  players:   number
  available: boolean
}

interface InstallResult {
  version:     string
  releaseDate: string
}

// Ajout du type manquant (référencé dans VersionCheckResult)
interface GameVersionInfo {
  version:     string | null
  releaseDate: string | null
}

interface VersionCheckResult {
  currentLauncherVersion:    string
  latestLauncherVersion:     string | null
  latestLauncherReleaseDate: string | null
  launcherUpdateAvailable:   boolean
  latestGameVersions:        Record<Env, GameVersionInfo>
}

interface UserInfo {
  sub:      string
  username: string
  email:    string
}

type AuthStateChangedPayload =
  | { env: Env; status: 'connected'; user: UserInfo }
  | { env: Env; status: 'error';     error: string }

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // ── Fichiers / Installation ──────────────────────────────────────────

      /** Ouvre un dialogue natif de sélection de répertoire. */
      selectDirectory: () => Promise<string | null>

      /** Lance le téléchargement et l'installation du jeu. */
      installGame: (env: Env, installPath: string) => Promise<InstallResult>

      /** S'abonne aux événements de progression de l'installation (0–100). */
      onInstallProgress: (callback: (progress: number, label: string) => void) => void

      /** Lit CHANGELOG.md dans le dossier d’installation (après extraction du ZIP). */
      readChangelog: (installPath: string) => Promise<string | null>

      /** Supprime shader_cache et chunk_cache dans le userdata Godot DyingStar. */
      clearGodotGameCache: () => Promise<{
        root: string
        removed: string[]
        skipped: string[]
        errors: { path: string; message: string }[]
      }>

      // ── Jeu ─────────────────────────────────────────────────────────────

      /** Lance l'exécutable du jeu (détaché du launcher). */
      launchGame: (env: Env, installPath: string) => Promise<void>

      /** Récupère le statut du serveur et le nombre de joueurs connectés. */
      getServerStatus: (env: Env) => Promise<ServerStatusResult>

      // ── Disponibilité ─────────────────────────────────────────────────────
      checkEnvAvailability:  () => Promise<Record<Env, boolean>>

      /** Ferme complètement le launcher. */
      quitApp: () => Promise<void>

      // ── Versions ─────────────────────────────────────────────────────────

      checkVersions: () => Promise<VersionCheckResult>

      // ── Auth ─────────────────────────────────────────────────────────────

      /** Ouvre le navigateur sur la page Discord/Keycloak pour l'env donné. */
      authLogin: (env: Env) => Promise<void>

      /** Efface les tokens de l'env donné et ouvre la page de déconnexion Keycloak. */
      authLogout: (env: Env) => Promise<void>

      /** Recharge la session depuis le stockage chiffré pour l'env donné. */
      authLoadUser: (env: Env) => Promise<UserInfo | null>

      /** S'abonne aux changements d'état auth — payload inclut l'env concerné. */
      onAuthStateChanged: (callback: (data: AuthStateChangedPayload) => void) => void
    }
  }
}