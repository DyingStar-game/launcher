# 0050. Launcher updated in place with `electron-updater`

- **Status:** Accepted
- **Date:** 2026-10-24
- **Deciders:** maintainer
- **Scope:** Launcher update (`main/services/version.ts`, a new `main/services/launcherUpdate/`), preload, `LauncherUpdateBar`, release CI, dependencies

## Context

At startup, `version:check` reads the latest GitHub release of the launcher
(`VITE_LAUNCHER_GITHUB_REPO_URL`) and compares its tag with `app.getVersion()`. When a newer one
is out, `LauncherUpdateBar` shows it with a button that opens the release page: the player
downloads the installer, closes the launcher and runs it by hand. Many stay on an old launcher,
and an old launcher can break with the services (auth, social, game versions) it talks to.

electron-builder, already used to package the launcher, has a companion, `electron-updater`: it
reads a `latest*.yml` file published next to the installers, downloads the new build in the
background (differentially, through `.blockmap` files) and installs it on restart. What it can
update depends on the target:

| Target                   | In-place update                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Windows NSIS             | Yes. An unsigned build updates; SmartScreen warns as it does for the first install.                                        |
| Linux AppImage           | Yes: the `.AppImage` file is replaced, when the launcher runs from it (`APPIMAGE` set, also under NixOS's `appimage-run`). |
| Linux deb / rpm          | Possible since electron-updater 6, through `pkexec` / `sudo`: a password prompt, and it bypasses the distribution's tools. |
| macOS                    | Needs a signed and notarised app; no macOS build is published today.                                                       |
| `make dev`, `make start` | No (not packaged).                                                                                                         |

The release workflow (`build.yaml`, job `release`) uploads the `.exe`, `.AppImage`, `.deb` and
`.rpm` only, and `package.json` has no `publish` setting: no `latest*.yml` reaches the release.

## Options considered

1. **Keep the download link** — nothing to build. The player still updates by hand, and many
   do not.
2. **Our own updater** — download the installer from the release in main and run it. Rewrites
   what `electron-updater` does (differential download, checksum, NSIS silent install, AppImage
   swap) with less testing behind it.
3. **`electron-updater`, where it updates in place, the link elsewhere** — Windows NSIS and the
   AppImage update by themselves; deb, rpm and unpackaged runs keep today's bar and link.
4. **`electron-updater` everywhere, deb and rpm included** — one path for all, at the cost of a
   root password prompt and a package installed outside the distribution's package manager.
   Rare among desktop apps, and the system prompt does not even name the launcher (it runs
   `bash -c` as root): it reads as a suspicious request.
5. **Our own APT and DNF repositories for deb and rpm** — the way of VS Code, Chrome or Signal:
   the package adds the repository, and the distribution's updates bring the new launcher, with
   no prompt from us. Needs a signed repository (GPG key), its hosting, and a publish at each
   release.

## Decision

We will take option 3.

- **Dependency:** `electron-updater`, latest release of its major, in `dependencies` (it runs in
  main, inside the packaged app), under ADR 0006's "latest within the current major" rule.
- **Publishing:** `package.json` `build.publish` names the GitHub provider
  (`DyingStar-game/launcher`); builds keep `--publish never`, and the `release` job uploads the
  `latest.yml`, `latest-linux.yml` and `*.exe.blockmap` files with the installers (the AppImage
  embeds its block map). The installer is named `Dying_Star_Launcher-Setup-X.Y.Z.exe`, without
  spaces: GitHub renames the spaces of uploaded files, and `latest.yml` would no longer match. The AppImage is named `Dying_Star_Launcher.AppImage`, without its version: an update then keeps its path, where a versioned name would be renamed by the update and break the player's shortcuts to it. The
  tag `vX.Y.Z` equals `package.json`'s `version`, which the job checks before publishing.
- **Main** (`main/services/launcherUpdate/`, ADR 0003): at startup, when the app is packaged and
  runs as NSIS or AppImage, `autoUpdater` checks the release, with `autoDownload` on. Its state
  (`idle`, `downloading` with a percentage, `ready` with the version, `error`, `unsupported`) is
  pushed on `launcher:update-state` as a structured value, never user-facing text, and
  `launcher:get-update-state` returns it to a renderer that loads later. `launcher:install-update`
  calls `quitAndInstall`. `version:check` stays: it is what tells the deb, rpm and unpackaged
  runs a version is out, and the fallback when the updater fails. It also returns the release's
  package of the type the launcher was installed from (electron-builder's
  `resources/package-type`), so a deb or rpm player downloads the new `.deb` or `.rpm` directly
  ("Download the .deb"), with a word that the AppImage version updates itself.
- **When it installs:** when the player clicks, or else when they quit the launcher once the
  update is downloaded (`autoInstallOnAppQuit`), so a player who never clicks still starts the
  next time on the new version: the way of VS Code, Slack and `electron-updater`'s default. The
  start is never held up by an update (as Discord or Steam do): a slow download does not keep
  anyone from playing. Never while the game runs or a game install is in progress:
  `launcher:install-update` refuses then, and `autoInstallOnAppQuit` is turned off for that time,
  leaving the update for the next quit.
- **Where:** in the strip that tells a launcher update today, `LauncherUpdateBar`, at the same
  place (bottom of the universe page). It gains the states: downloading (a progress bar, the game
  stays playable), ready (a "Restart to update" button, disabled with its reason in a tooltip
  while the game runs or installs, ADR 0048), and today's download link when the update is
  `unsupported` or in `error`. A failed download or install is an error toast (CLAUDE.md,
  toasts). Strings in `en.json` and `fr.json`.

## Consequences

- Windows and AppImage players update with one click, without downloading anything by hand; deb
  and rpm players download the new package directly, and install it themselves, as Discord's deb
  does.
- To do later, when Linux players are many enough: option 5, APT and DNF repositories, in an ADR
  of their own; not done now (signing key, hosting and publishing to maintain).
- A player who never clicks gets the update when quitting the launcher, without being asked; a
  player who keeps it open for days stays on their version until then.
- The first launcher shipping this still has to be installed by hand: earlier ones only know the
  link.
- A broken release reaches every Windows and AppImage player by their next start. Releases are
  tested (`make start`, the PR builds) before the tag is pushed; a bad one is fixed by a newer
  tag, since `electron-updater` does not downgrade.
- A release whose `latest*.yml` is missing or wrong leaves players on their version, with the
  link as fallback; the `release` job fails rather than publish without them.
- An update forced at start (below a minimum launcher version announced by the API, as Discord
  does) is not part of this decision; a new ADR covers it if old launchers come to break the
  services.
- macOS stays out until a signed and notarised build is published; then a new ADR covers it.
- Signing the Windows installer would remove SmartScreen's warning; it is not required by this
  decision.
