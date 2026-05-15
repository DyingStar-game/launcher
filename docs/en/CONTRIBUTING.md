# Contributing

Thank you for contributing to Dying Star Launcher.

## Quick links

- [Onboarding](ONBOARDING.md) — architecture, setup, branches
- [Code of conduct](CODE_OF_CONDUCT.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Development workflow

1. Fork the repository (if external contributor) and clone locally
2. Check out **`develop`** and create a branch: `feature/short-description` or `fix/short-description`
3. Install dependencies with **pnpm only**: `pnpm install`
4. Copy `.env.example` to `.env` and configure as needed
5. Make your changes
6. Run checks:
   ```bash
   pnpm run format
   pnpm run typecheck
   pnpm run lint
   ```
7. Open a Pull Request **into `develop`**

## Code guidelines

- **TypeScript** everywhere; avoid `any` unless justified
- **Comments and JSDoc** on public APIs and non-obvious logic — in **English**
- **User-facing strings** only via i18n (`src/renderer/i18n/*.json`), not hardcoded in components
- **IPC**: add handlers in `src/main`, expose in `src/preload/index.ts`, types in `src/preload/index.d.ts` and `@shared/types` when shared
- Keep PRs small and focused; one topic per PR when possible

## Commit messages

Use clear, imperative subjects, e.g.:

- `feat(files): add install path validation`
- `fix(auth): handle cancelled OAuth flow`
- `docs: update onboarding for pnpm`

## Pull request checklist

- [ ] Based on latest `develop`
- [ ] `pnpm run typecheck` passes
- [ ] `pnpm run lint` passes (or only pre-existing warnings documented)
- [ ] User-visible changes reflected in `docs/en/CHANGELOG.md` and `docs/fr/CHANGELOG.md`
- [ ] No secrets or `.env` files committed
- [ ] Screenshots attached for UI changes (optional but appreciated)

## Releases

Maintainers merge `develop` → `main` and tag releases. Built artifacts are published via GitHub Releases (see root `README.md` build scripts).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](../../LICENSE) of this project.
