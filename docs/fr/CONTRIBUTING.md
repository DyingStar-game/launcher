# Contribuer

Merci de contribuer au Dying Star Launcher.

## Liens utiles

- [Onboarding](ONBOARDING.md) — architecture, installation, branches
- [Code de conduite](CODE_OF_CONDUCT.md)
- [Politique de sécurité](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Workflow

1. Fork (contributeur externe) et clone
2. Se placer sur **`develop`**, créer une branche : `feature/description` ou `fix/description`
3. Installer avec **pnpm uniquement** : `pnpm install`
4. Copier `.env.example` → `.env`
5. Implémenter les changements
6. Vérifications :
   ```bash
   pnpm run format
   pnpm run typecheck
   pnpm run lint
   ```
7. Ouvrir une Pull Request **vers `develop`**

## Conventions de code

- **TypeScript** ; éviter `any` sans raison
- **Commentaires et JSDoc** en **anglais** sur les APIs et logique non triviale
- **Textes UI** uniquement via i18n (`src/renderer/i18n/*.json`)
- **IPC** : handler dans `src/main`, exposition dans `preload`, types dans `@shared/types` si partagés
- PRs courtes et ciblées

## Messages de commit

Sujets clairs à l’impératif, par ex. :

- `feat(files): validate install path`
- `fix(auth): handle cancelled OAuth`
- `docs: onboarding pnpm`

## Checklist PR

- [ ] Basée sur `develop` à jour
- [ ] `pnpm run typecheck` OK
- [ ] `pnpm run lint` OK
- [ ] Changelog EN + FR mis à jour si changement visible
- [ ] Pas de secrets ni de `.env` commité
- [ ] Captures d’écran pour changements UI (optionnel)

## Releases

Les mainteneurs fusionnent `develop` → `main` et taguent. Voir le `README.md` racine pour les builds.

## Licence

En contribuant, tu acceptes la licence [MIT](../../LICENSE) du projet.
