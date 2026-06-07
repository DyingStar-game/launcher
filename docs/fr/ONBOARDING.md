# Onboarding contributeur

Bienvenue dans le dépôt **Dying Star Launcher**. Ce guide t’aide à comprendre le projet et à lancer un environnement de dev rapidement.

## De quoi il s’agit

Un **launcher Electron** pour le jeu _Dying Star_. Il gère notamment :

- Authentification Discord / Keycloak (par environnement)
- Téléchargement, installation et mises à jour du jeu (ZIP via URLs configurables)
- Statut serveur et nombre de joueurs
- Vérification des mises à jour du launcher (GitHub Releases)
- Articles de lore (markdown embarqué) et une **UI social** (données mock pour l’instant)

## Arborescence

```
src/
├── main/       # Process Electron principal (IPC, auth, téléchargement, lancement jeu)
├── preload/    # API contextBridge exposée en window.api
├── renderer/   # UI React (vues, composants, stores Zustand, i18n)
└── shared/     # Types TypeScript partagés entre processus
docs/           # Documentation contributeur (en/ et fr/)
resources/      # Icônes et entitlements macOS
```

Alias (Vite/TS) : `@shared`, `@components`, `@views`, `@stores`, `@hooks`, `@lib`, `@i18n`, `@content`, `@assets`.

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

- **Node.js 20+**
- **pnpm** (seul gestionnaire de paquets du dépôt — voir `packageManager` dans `package.json`)
- Git

## Première installation

```bash
git clone https://github.com/DyingStar-game/launcher.git
cd launcher
git checkout develop
pnpm install
cp .env.example .env
# Éditer .env — au minimum les URLs universe-testing pour tester l’install
pnpm run dev
```

### Fichiers d’environnement

- Copier `.env.example` → `.env` (ne jamais committer `.env`)
- Les variables `VITE_*` sont incluses dans le binaire au build
- Pour travailler sur l’UI seule, les URLs de test dans l’exemple peuvent suffire

### Scripts utiles

| Commande             | Description                   |
| -------------------- | ----------------------------- |
| `pnpm run dev`       | Dev avec rechargement à chaud |
| `pnpm run typecheck` | TypeScript (main + renderer)  |
| `pnpm run lint`      | ESLint                        |
| `pnpm run format`    | Prettier                      |
| `pnpm run build`     | Build production dans `out/`  |

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

Workflow recommandé avant commit :

```bash
pnpm run format
pnpm run typecheck
pnpm run lint
```

### VS Code / Cursor

Fichiers recommandés dans `.vscode/` :

1. Extensions :
   - **ESLint** (`dbaeumer.vscode-eslint`)
   - **Prettier** (`esbenp.prettier-vscode`)
2. `.vscode/settings.json` : Prettier par défaut + format à l’enregistrement.

Sinon : formateur par défaut **Prettier** + **Format On Save** activé.

### CI

À terme : `pnpm run typecheck` et `pnpm run lint` sur chaque PR vers `develop`.

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

### Page Social (mock)

`src/renderer/stores/social.ts` utilise des **données mock** en attendant les APIs. Les erreurs passent par `SocialStoreError` et `src/renderer/lib/socialErrors.ts`.

### Deux environnements jeu

- `universe` — production
- `universe-testing` — test

Le sélecteur de la navbar change `useEnvStore().activeEnv` ; la plupart des stores sont indexés par `Env`.

## Avant d’ouvrir une PR

1. Partir de **`develop`**
2. `pnpm run typecheck && pnpm run lint`
3. PR focalisée, style cohérent avec le dépôt
4. Pour un changement visible utilisateur, remplir les sections `<!-- CHANGELOG_EN -->` et `<!-- CHANGELOG_FR -->` dans la description de la PR — les entrées sont enregistrées automatiquement à la fusion
5. Lire [CONTRIBUTING.md](CONTRIBUTING.md)

## Aide

- Discussion ou Issue GitHub
- Sécurité : [SECURITY.md](SECURITY.md) — **pas** d’issue publique pour une vulnérabilité
