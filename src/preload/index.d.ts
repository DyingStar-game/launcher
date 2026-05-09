import { ElectronAPI } from '@electron-toolkit/preload'

type ServerStatus = 'online' | 'offline' | 'degraded' | 'checking'

interface ServerStatusResult {
  status: ServerStatus
  players: number
  statusPageUrl: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      // ── Fichiers / Installation ────────────────────────────────────────────

      /** Ouvre un dialogue natif de sélection de répertoire. */
      selectDirectory: () => Promise<string | null>

      /** Lance le téléchargement et l'installation du jeu. */
      installGame: (installPath: string) => Promise<void>

      /** S'abonne aux événements de progression de l'installation (0–100). */
      onInstallProgress: (callback: (progress: number, label: string) => void) => void

      // ── Jeu ───────────────────────────────────────────────────────────────

      /** Lance l'exécutable du jeu (détaché du launcher). */
      launchGame: (installPath: string) => Promise<void>

      /** Récupère le statut du serveur et le nombre de joueurs connectés. */
      getServerStatus: () => Promise<ServerStatusResult>
    }
  }
}