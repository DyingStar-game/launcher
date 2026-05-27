# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-05-27

- fix player count on game panel
- fix expiration authentication
- fix game version update
- fix `ERROR:crashpad_client_win.cc` on Windows by initialising `crashReporter` in the main process before any window is created

## [0.2.1] - 2026-05-17

### Fixed

- size of launcher, in some case expands on its own at startup
- link to download the new version of the launcher

## [0.2.0] - 2026-05-16

### Added

- Bilingual contributor docs under `docs/en/` and `docs/fr/` (onboarding, contributing, security, code of conduct)
- Structured install progress labels with full UI i18n (`installProgress.*`)
- Browser language detection and persisted UI language (`ds-language`)
- github actions for build the launcher

### Changed

- Package manager standardized on **pnpm** (removed `package-lock.json`)
- Native install folder dialog localized (fr/en) via main-process l10n
- Social `addFriend` mock validates duplicate names and throws typed errors

### Removed

- Unused `game:get-state` IPC stub

## [0.1.0] - 2025-01-01

### Added

- Initial open-source Electron launcher: auth, game install/update, server status, lore, social UI (mock)

[Unreleased]: https://github.com/DyingStar-game/launcher/compare/v0.1.0...develop
[0.1.0]: https://github.com/DyingStar-game/launcher/releases/tag/v0.1.0
