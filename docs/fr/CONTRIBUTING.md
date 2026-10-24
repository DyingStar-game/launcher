# Contribuer

Merci de contribuer au Dying Star Launcher.

## Liens utiles

- [Onboarding](ONBOARDING.md) — architecture, installation, branches
- [Code de conduite](CODE_OF_CONDUCT.md)
- [Politique de sécurité](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Architecture Decision Records](../adr/README.md)

## Workflow

1. Fork (contributeur externe) et clone
2. Se placer sur **`develop`**, créer une branche : `feature/description` ou `fix/description`
3. Installer avec **pnpm uniquement** : `make install` (crée `.env` depuis `.env.example` ; sinon `pnpm install` + copie manuelle)
4. Configurer `.env` si besoin
5. Implémenter les changements
6. Vérifications :
   ```bash
   make check
   ```
   (sans `make` : `pnpm run format && pnpm run lint && pnpm run typecheck`)
7. Ouvrir une Pull Request **vers `develop`**

## Conventions de code

- **TypeScript** ; éviter `any` sans raison
- **Commentaires et JSDoc** en **anglais** sur les APIs et logique non triviale
- **Textes UI** uniquement via i18n (`src/renderer/i18n/*.json`)
- **IPC** : handler dans `src/main`, exposition dans `preload`, types dans `@shared/types` si partagés
- PRs courtes et ciblées

## Décisions d’architecture

Les décisions importantes sont consignées en ADR dans [`docs/adr/`](../adr/README.md) (en anglais) :
rédigées en `Proposed` dans la PR, `Accepted` avant l’implémentation. Un ADR accepté fait foi :
relire les ADR de la zone touchée et vérifier son changement par rapport à eux avant la revue.

## Messages de commit

Sujets clairs à l’impératif, par ex. :

- `feat(files): validate install path`
- `fix(auth): handle cancelled OAuth`
- `docs: onboarding pnpm`

## Checklist PR

- [ ] Basée sur `develop` à jour
- [ ] `make check` OK
- [ ] Changement conforme aux ADR acceptés de la zone ; nouvelle décision importante consignée en ADR
- [ ] Changement visible décrit dans les sections `CHANGELOG_EN` / `CHANGELOG_FR` de la description de PR (titre de type et `[domaine]` par entrée, [format](https://github.com/DyingStar-game/changelog/blob/main/docs/adr/0001-changelog-format.md) ; vérifié sur la PR, enregistré à la fusion)
- [ ] Pas de secrets ni de `.env` commité
- [ ] Captures d’écran pour changements UI (optionnel)

## Releases

Les mainteneurs fusionnent `develop` → `main` et taguent. Voir le `README.md` racine pour les builds. Le tag `vX.Y.Z` doit égaler la `version` de `package.json` (le job de release le vérifie) : les launchers installés se mettent à jour depuis les `latest.yml` / `latest-linux.yml` de la release (ADR 0050), donc tester un build (`make start`, les artefacts de la PR) avant de pousser le tag.

## Licence

En contribuant, tu acceptes la licence [MIT](../../LICENSE) du projet.
