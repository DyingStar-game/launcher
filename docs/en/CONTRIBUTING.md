# Contributing

Thank you for contributing to Dying Star Launcher.

## Quick links

- [Onboarding](ONBOARDING.md) — architecture, setup, branches
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)
- [Architecture Decision Records](../adr/README.md)

## Development workflow

1. Fork the repository (if external contributor) and clone locally
2. Check out **`develop`** and create a branch: `feature/short-description` or `fix/short-description`
3. Install dependencies with **pnpm only**: `make install` (creates `.env` from `.env.example`; or `pnpm install` + copy it yourself)
4. Configure `.env` as needed
5. Make your changes
6. Run checks:
   ```bash
   make check
   ```
   (without `make`: `pnpm run format && pnpm run lint && pnpm run typecheck`)
7. Open a Pull Request **into `develop`**

## Code guidelines

- **TypeScript** everywhere; avoid `any` unless justified
- **Comments and JSDoc** on public APIs and non-obvious logic — in **English**
- **User-facing strings** only via i18n (`src/renderer/i18n/*.json`), not hardcoded in components
- **IPC**: add handlers in `src/main`, expose in `src/preload/index.ts`, types in `src/preload/index.d.ts` and `@shared/types` when shared
- Keep PRs small and focused; one topic per PR when possible

## Architecture decisions

Significant decisions are recorded as ADRs in [`docs/adr/`](../adr/README.md): drafted as
`Proposed` in the PR, `Accepted` before implementation. An accepted ADR is binding: reread the
ADRs of the area you touch, and check your change against them before asking for review.

## Commit messages

Use clear, imperative subjects, e.g.:

- `feat(files): add install path validation`
- `fix(auth): handle cancelled OAuth flow`
- `docs: update onboarding for pnpm`

## Pull request checklist

- [ ] Based on latest `develop`
- [ ] `make check` passes (or only pre-existing warnings documented)
- [ ] Change follows the accepted ADRs of the area; new significant decision recorded as an ADR
- [ ] User-visible changes described in the `CHANGELOG_EN` / `CHANGELOG_FR` sections of the PR description (type heading and `[area]` per entry, [format](https://github.com/DyingStar-game/changelog/blob/main/docs/adr/0001-changelog-format.md); checked on the PR, recorded on merge)
- [ ] No secrets or `.env` files committed
- [ ] Screenshots attached for UI changes (optional but appreciated)

## Releases

Maintainers merge `develop` → `main` and tag releases. Built artifacts are published via GitHub Releases (see root `README.md` build scripts).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](../../LICENSE) of this project.
