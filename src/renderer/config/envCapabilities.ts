// Source de vérité unique pour la disponibilité des fonctionnalités par env.
// Mettre à true quand l'URL correspondante est prête côté serveur.

import type { Env } from '@store/env'

export type EnvCapabilities = {
  /** Authentification Keycloak disponible pour cet env */
  authAvailable:    boolean
  /** URL de téléchargement du jeu disponible pour cet env */
  installAvailable: boolean
}

export const ENV_CAPABILITIES: Record<Env, EnvCapabilities> = {
  'universe': {
    authAvailable:    false,  // TODO: passer à true quand l'URL auth prod est prête
    installAvailable: false   // TODO: passer à true quand l'URL zip prod est prête
  },
  'universe-testing': {
    authAvailable:    true,
    installAvailable: true
  }
}