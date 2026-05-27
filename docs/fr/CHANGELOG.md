# Changelog

Toutes les modifications notables du projet sont documentées ici.

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
versionnage [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

## [0.2.2] - 2026-05-27

- correction du nombre de joueur sur le panel game
- correction expiration authentification
- correction de la mise a jour d'une nouvelle version du jeu
- correction de l'erreur `ERROR:crashpad_client_win.cc` sur Windows en initialisant `crashReporter` dans le processus principal avant la création de fenêtre

## [0.2.1] - 2026-05-17

### Corrigé

- taille du launcher, dans certains cas ça s'agrandi tout seul au démarrage
- lien pour télécharger la nouvelle version du launcher

## [0.2.0] - 2026-05-16

### Ajouté

- Documentation contributeur bilingue dans `docs/en/` et `docs/fr/` (onboarding, contribution, sécurité, code de conduite)
- Libellés de progression d’installation structurés et i18n UI (`installProgress.*`)
- Détection de la langue navigateur et persistance (`ds-language`)
- github actions pour build le launcher

### Modifié

- Gestionnaire de paquets **pnpm** uniquement (suppression de `package-lock.json`)
- Dialogue natif de dossier d’installation localisé (fr/en) côté main
- Mock `addFriend` : validation des doublons et erreurs typées

### Supprimé

- Stub IPC inutilisé `game:get-state`

## [0.1.0] - 2025-01-01

### Ajouté

- Premier launcher Electron open source : auth, install/mise à jour jeu, statut serveur, lore, UI social (mock)

[Non publié]: https://github.com/DyingStar-game/launcher/compare/v0.1.0...develop
[0.1.0]: https://github.com/DyingStar-game/launcher/releases/tag/v0.1.0
