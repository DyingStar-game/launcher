# Dying Star Launcher

Launcher desktop open source pour le jeu **Dying Star**, basé sur [Electron](https://www.electronjs.org/) + [electron-vite](https://electron-vite.org/), avec une interface **React 19** et **Tailwind CSS v4**.

## Stack

| Couche        | Technologie               |
| ------------- | ------------------------- |
| Shell desktop | Electron 38               |
| Build         | electron-vite, Vite 7     |
| UI            | React 19, Tailwind CSS v4 |
| État          | Zustand                   |
| i18n          | i18next / react-i18next   |
| Packaging     | electron-builder          |

## Structure du projet

```
src/
├── main/           # Process principal Electron (IPC, auth, téléchargement, jeu)
├── preload/        # Pont sécurisé contextBridge → window.api
├── renderer/       # Application React (composants, vues, stores, i18n)
└── shared/         # Types TypeScript partagés (main, preload, renderer)
docs/               # Documentation contributeur (en/ et fr/)
resources/          # Icônes et entitlements macOS (versionnés)
```

Alias TypeScript / Vite : `@shared`, `@components`, `@views`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

## Prérequis

- Node.js 20+
- [pnpm](https://pnpm.io/) (gestionnaire de paquets du dépôt)

## Installation

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
git checkout develop
pnpm install
cp .env.example .env
# Éditer .env selon l’environnement (API, ZIP de test, etc.)
```

## Scripts

| Commande               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `pnpm run dev`         | Développement avec rechargement à chaud                |
| `pnpm run build`       | Vérification TypeScript + build de production (`out/`) |
| `pnpm run start`       | Prévisualiser le build packagé                         |
| `pnpm run typecheck`   | Contrôle TypeScript (main + renderer)                  |
| `pnpm run lint`        | ESLint                                                 |
| `pnpm run lint:fix`    | ESLint avec corrections automatiques                   |
| `pnpm run format`      | Prettier                                               |
| `pnpm run build:win`   | Installateur Windows (NSIS)                            |
| `pnpm run build:mac`   | Application macOS                                      |
| `pnpm run build:linux` | AppImage / deb / rpm                                   |

Les artefacts de distribution sont générés dans `release/`.

## Variables d’environnement

Copier `.env.example` vers `.env`. Les variables exposées au code utilisent le préfixe `VITE_` (voir le fichier d’exemple pour les URLs d’API, archives de jeu, navigation, statut serveur, etc.).

## Contribution

**Branche de développement par défaut : `develop`** (ne pas partir de `main` pour le dev quotidien).

Documentation bilingue :

- Index : [docs/README.md](docs/README.md)
- Onboarding : [English](docs/en/ONBOARDING.md) · [Français](docs/fr/ONBOARDING.md)
- Contributing : [English](docs/en/CONTRIBUTING.md) · [Français](docs/fr/CONTRIBUTING.md)

Avant une PR : `pnpm run typecheck && pnpm run lint`

## Licence

[MIT License](LICENSE) — Copyright (c) Dying Star
