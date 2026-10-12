# Onboarding contributeur

Bienvenue dans le dépôt **Dying Star Launcher**. Ce guide t’aide à comprendre le projet et à lancer un environnement de dev rapidement.

## De quoi il s’agit

Un **launcher Electron** pour le jeu _Dying Star_. Il gère notamment :

- Authentification Discord / Keycloak (par environnement)
- Téléchargement (pause, reprise, annulation), installation et mises à jour du jeu (ZIP via URLs configurables)
- Statut serveur et nombre de joueurs
- Vérification des mises à jour du launcher (GitHub Releases)
- Une **UI social** (amis, demandes, organisations) sur le service de jeu `social`

## Arborescence

```
src/
├── main/       # Process Electron principal (IPC, auth, téléchargement, lancement jeu)
├── preload/    # API contextBridge exposée en window.api
├── renderer/   # UI React en atomic design (components/{atoms,molecules,organisms,templates}, pages/), stores Zustand, i18n
└── shared/     # Types TypeScript partagés entre processus
docs/           # Documentation contributeur (en/ et fr/)
resources/      # Icônes et entitlements macOS
```

Alias (Vite/TS) : `@shared`, `@components`, `@pages`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@assets`.

Les composants suivent l’**atomic design** ([ADR 0011](../adr/0011-atomic-design.md)) : les imports ne vont que vers le bas, atomes / molécules / templates sont purs (pas de store), et tout composant nouveau ou modifié vient avec son `*.test.tsx` (Testing Library). Son rendu (tailles, alignements, couleurs, points de rupture) est mesuré par un `*.browser.test.tsx`, exécuté dans Chromium headless avec le vrai CSS Tailwind ([ADR 0033](../adr/0033-rendering-tests-vitest-browser.md)) ; `make install` télécharge Chromium.

## Branches

| Branche          | Rôle                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| **`develop`**    | **Branche par défaut pour le développement.** Ouvre tes PR ici.        |
| `main`           | Stable / alignée releases (merge depuis `develop` par les mainteneurs) |
| Branches feature | `feature/ton-sujet` depuis `develop`                                   |

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ma-modif
```

## Prérequis

- **Node.js 24** (fixé dans `.nvmrc` : `nvm use`)
- **pnpm 12** (seul gestionnaire de paquets du dépôt, version fixée par `packageManager` dans `package.json` ; ses réglages sont dans `pnpm-workspace.yaml`)
- Git
- **make** (optionnel : Linux / macOS / WSL / Git Bash ; chaque cible appelle un script pnpm)

## Première installation

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
git checkout develop
make install   # crée .env depuis .env.example, puis pnpm install
# Éditer .env — au minimum les URLs universe-testing pour tester l’install
make dev
```

### Fichiers d’environnement

- Copier `.env.example` → `.env` (ne jamais committer `.env`)
- Les variables `VITE_*` sont incluses dans le binaire au build
- Pour travailler sur l’UI seule, les URLs de test dans l’exemple peuvent suffire

### Makefile

Le `Makefile` à la racine est le point d’entrée commun, comme dans les autres dépôts DyingStar
([ADR 0002](../adr/0002-makefile-tooling.md)). `make help` liste toutes les cibles.

| Commande          | Description                                                       |
| ----------------- | ----------------------------------------------------------------- |
| `make start`      | Build et lancement en mode preview production (testeurs)          |
| `make install`    | Crée `.env` s’il manque, installe les dépendances                 |
| `make dev`        | Dev avec rechargement à chaud                                     |
| `make pnpm <cmd>` | N’importe quel script pnpm, ex. `make pnpm typecheck:web`         |
| `make check`      | Format, lint, typecheck, vérification du format — avant un commit |
| `make build`      | Build production dans `out/`                                      |
| `make package`    | Installeur pour l’OS courant dans `release/`                      |

Sous Linux, Electron choisit X11 ou Wayland selon la session. Pour reproduire un bug d’affichage
sur l’autre backend, forcez-le avec `make dev PLATFORM=wayland` ou `make dev PLATFORM=x11`
(idem pour `make start`). Sous WSLg, le socket Wayland est trouvé automatiquement.
| `make clean` | Supprime `out/`, `release/` et le cache ESLint |

Sans `make` (ex. Windows sans Git Bash), appeler directement les scripts pnpm : `pnpm run dev`,
`pnpm run typecheck`, `pnpm run lint`, `pnpm run format`, `pnpm run build`.

## ESLint et Prettier

Le dépôt inclut **ESLint 9** (flat config) et **Prettier**, installés via `pnpm install` (pas d’installation globale nécessaire).

### Fichiers de configuration

| Fichier             | Rôle                                                                  |
| ------------------- | --------------------------------------------------------------------- |
| `eslint.config.mjs` | Config ESLint flat (TypeScript, React, Hooks, intégration Prettier)   |
| `.prettierrc.yaml`  | Règles Prettier (guillemets simples, sans point-virgule, largeur 100) |
| `.prettierignore`   | Chemins exclus (`out/`, lockfiles, etc.)                              |

`@electron-toolkit/eslint-config-prettier` évite les conflits : le formatage est géré par Prettier.

### Commandes (racine du dépôt)

```bash
# Vérifier le lint (obligatoire avant une PR)
pnpm run lint

# Corriger automatiquement (y compris Prettier via eslint)
pnpm run lint:fix

# Formater tout le projet
pnpm run format
```

Avant un commit, tout lancer d’un coup :

```bash
make check
```

### VS Code / Cursor

Fichiers recommandés dans `.vscode/` :

1. Extensions :
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Prettier** (`esbenp.prettier-vscode`)
2. `.vscode/settings.json` : Prettier par défaut + format à l’enregistrement.

Sinon : formateur par défaut **Prettier** + **Format On Save** activé.

### CI

`.github/workflows/build.yaml` lance `pnpm run lint` et `pnpm run typecheck` à chaque push et PR, puis builde Linux et Windows.

## Modèle mental de l’app

1. Le **renderer** (React + Zustand) appelle **`window.api.*`** via le preload.
2. Le **preload** transmet via `ipcRenderer.invoke` vers les handlers **main**.
3. Le **main** fait le réseau, fichiers, OAuth, process jeu, et renvoie des événements (auth, progression install).

La progression d’installation utilise des **clés structurées** (`InstallProgressLabel` dans `src/shared/types/installProgress.ts`) ; le renderer les traduit via i18next (`installProgress.*`).

## Internationalisation (i18n)

- Chaînes UI : `src/renderer/i18n/en.json` et `fr.json`
- `useTranslation()` + `t('clé')` dans les composants — pas de texte utilisateur en dur dans le TSX
- Langue : détection navigateur + `localStorage` (`ds-language`) ; drapeaux dans la navbar
- Dialogue dossier natif (main) : `src/main/l10n/dialogs.ts` (locale OS fr/en)

## Points importants

### Page Social

Le process main appelle le service `social` (`src/main/services/social/`, [ADR 0007](../adr/0007-social-player-side.md)) avec le jeton Keycloak du joueur. Il est disponible sur `universe-testing` (service preprod par défaut, `VITE_SOCIAL_BASE_TESTING`) et affiche « indisponible » sur `universe` tant que la prod n’est pas déployée. Connecte-toi sur `universe-testing` pour l’essayer. Les erreurs remontent sous forme de codes, traduits sous `universe.socialPage.errors.*`.

### Deux environnements jeu

- `universe` — production
- `universe-testing` — test

Le sélecteur de la navbar change `useEnvStore().activeEnv` ; la plupart des stores sont indexés par `Env`.

### Images de l’accueil

La page d’accueil fait défiler en fondu les images WebP de `src/renderer/assets/key-art/`, dans l’ordre de leurs noms. Pour en ajouter une, déposer le PNG ou le JPEG dans `key-art/` à la racine du dépôt (non versionné) et lancer `make key-art` : les images nouvelles ou modifiées sont converties en WebP dans le dossier des assets, prises en compte sans toucher au code. `ARGS="--force"` reconvertit tout, `ARGS="--quality=0.9"` règle la qualité WebP (0.82 par défaut). Voir le README.

## Avant d’ouvrir une PR

1. Partir de **`develop`**
2. `make check`
3. PR focalisée, style cohérent avec le dépôt
4. Pour un changement visible utilisateur, remplir les sections `<!-- CHANGELOG_EN -->` et `<!-- CHANGELOG_FR -->` dans la description de la PR — les entrées sont enregistrées automatiquement à la fusion
5. Lire [CONTRIBUTING.md](CONTRIBUTING.md) et les [ADR](../adr/README.md) de la zone touchée

## Aide

- Discussion ou Issue GitHub
- Sécurité : [SECURITY.md](SECURITY.md) — **pas** d’issue publique pour une vulnérabilité
