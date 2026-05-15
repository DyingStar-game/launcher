# Dying Star Launcher

Launcher desktop open source pour le jeu **Dying Star**, basé sur [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/), avec une interface **React 19** et **Tailwind CSS v4**.

## Stack

| Couche | Technologie |
|--------|-------------|
| Shell desktop | Electron 38 |
| Build | electron-vite, Vite 7 |
| UI | React 19, Tailwind CSS v4 |
| État | Zustand |
| i18n | i18next / react-i18next |
| Packaging | electron-builder |

## Structure du projet

```
src/
├── main/           # Process principal Electron (IPC, auth, téléchargement, jeu)
├── preload/        # Pont sécurisé contextBridge → window.api
├── renderer/       # Application React (composants, vues, stores, i18n)
└── shared/         # Types TypeScript partagés (main, preload, renderer)
resources/          # Icônes et entitlements macOS (versionnés)
```

Alias TypeScript / Vite : `@shared`, `@components`, `@views`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

## Prérequis

- Node.js 20+
- npm ou pnpm

## Installation

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
npm install
cp .env.example .env
# Éditer .env selon l’environnement (API, ZIP de test, etc.)
```

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Développement avec rechargement à chaud |
| `npm run build` | Vérification TypeScript + build de production (`out/`) |
| `npm run start` | Prévisualiser le build packagé |
| `npm run typecheck` | Contrôle TypeScript (main + renderer) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run build:win` | Installateur Windows (NSIS) |
| `npm run build:mac` | Application macOS |
| `npm run build:linux` | AppImage / deb / rpm |

Les artefacts de distribution sont générés dans `release/`.

## Variables d’environnement

Copier `.env.example` vers `.env`. Les variables exposées au code utilisent le préfixe `VITE_` (voir le fichier d’exemple pour les URLs d’API, archives de jeu, navigation, statut serveur, etc.).

## Contribution

1. Créer une branche depuis `develop`
2. `npm run typecheck && npm run lint` avant toute PR
3. Respecter la structure `src/main`, `src/preload`, `src/renderer`, `src/shared`

## Licence

Voir le dépôt GitHub du projet pour les conditions de licence.
