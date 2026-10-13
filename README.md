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
├── renderer/       # Application React en atomic design (atoms → molecules → organisms → templates → pages), stores, i18n
└── shared/         # Types TypeScript partagés (main, preload, renderer)
docs/               # Documentation contributeur (en/ et fr/)
resources/          # Icônes et entitlements macOS (versionnés)
```

Alias TypeScript / Vite : `@shared`, `@components`, `@pages`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

## Prérequis

- Node.js 24 (fixé dans `.nvmrc`)
- [pnpm](https://pnpm.io/) (gestionnaire de paquets du dépôt)
- `make` (optionnel ; sous Windows via Git Bash ou WSL)

## Installation

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
git checkout develop
make install   # crée .env depuis .env.example puis lance pnpm install
# Éditer .env selon l’environnement (API, ZIP de test, etc.)
make dev
```

## Commandes

Le `Makefile` est le point d’entrée commun (`make help` liste tout, voir [ADR 0002](docs/adr/0002-makefile-tooling.md)) :

| Commande          | Description                                                    |
| ----------------- | -------------------------------------------------------------- |
| `make start`      | Build + preview production (testeurs)                          |
| `make dev`        | Développement avec rechargement à chaud                        |
| `make check`      | Format, lint, typecheck, vérification du format (avant commit) |
| `make pnpm <cmd>` | N’importe quel script pnpm, ex. `make pnpm typecheck:web`      |
| `make package`    | Installateur pour l’OS courant dans `release/`                 |
| `make key-art`    | Convertit les images de `key-art/` pour le carrousel d’accueil |

Les scripts pnpm sous-jacents restent utilisables directement :

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

## Images de l’accueil

Le fond de la page d’accueil fait défiler en fondu les images WebP de `src/renderer/assets/key-art/`, dans l’ordre alphabétique de leurs noms. Pour en ajouter une :

1. Déposer l’image (PNG ou JPEG, en pleine résolution) dans le dossier `key-art/` à la racine du dépôt. Il n’est pas versionné : seules les versions WebP le sont. Le premier `make key-art` le crée s’il n’existe pas.
2. Lancer `make key-art` : chaque image nouvelle ou modifiée est convertie en WebP (même définition, bien plus légère) et placée dans `src/renderer/assets/key-art/` sous le numéro suivant le plus grand déjà pris (`Mon image.png` → `key-art-05.webp`) ; la source est renommée à l’identique dans `key-art/` (`key-art-05.png`), pour retrouver le même WebP à la prochaine conversion.
3. Elle apparaît dans le carrousel au prochain lancement, après les autres, sans toucher au code. Pour changer l’ordre, renommer les fichiers `key-art-<NN>` (source et WebP).

Options : `make key-art ARGS="--force"` reconvertit tout, `ARGS="--quality=0.9"` change la qualité WebP (de 0 à 1, 0.82 par défaut). La conversion passe par le Chromium headless des tests de rendu, installé par `make install` : aucun outil d’image à installer. Pour retirer une image, supprimer son `.webp` et sa source dans `key-art/` (sinon `make key-art` la reconvertit).

## Variables d’environnement

Copier `.env.example` vers `.env`. Les variables exposées au code utilisent le préfixe `VITE_` (voir le fichier d’exemple pour les URLs d’API, archives de jeu, navigation, statut serveur, etc.).

## Contribution

**Branche de développement par défaut : `develop`** (ne pas partir de `main` pour le dev quotidien).

Documentation bilingue :

- Index : [docs/README.md](docs/README.md)
- Onboarding : [English](docs/en/ONBOARDING.md) · [Français](docs/fr/ONBOARDING.md)
- Contributing : [English](docs/en/CONTRIBUTING.md) · [Français](docs/fr/CONTRIBUTING.md)
- Décisions d’architecture (ADR) : [docs/adr/](docs/adr/README.md)

Avant une PR : `make check`

## Licence

[MIT License](LICENSE) — Copyright (c) Dying Star
