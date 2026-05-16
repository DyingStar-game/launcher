# Security policy

## Supported versions

Security fixes are applied to the latest release on the default branch and backported at maintainers’ discretion.

| Version        | Supported   |
| -------------- | ----------- |
| Latest release | Yes         |
| Older releases | Best effort |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Instead, email **contact@dyingstar-game.com** with:

- A description of the issue and impact
- Steps to reproduce
- Affected versions or commits if known
- Any proof-of-concept (optional)

We aim to acknowledge reports within a few business days and will coordinate disclosure after a fix is available.

## Scope notes for this project

- The launcher runs with elevated filesystem access for game install paths; only install to directories you trust.
- OAuth tokens are stored locally per environment; protect your user profile on shared machines.
- Variables prefixed with `VITE_` are embedded in the built application — never put secrets in `.env` with that prefix.
- Lore markdown is bundled locally; remote untrusted markdown is not loaded in production paths today.

## Safe defaults for contributors

- Keep `VITE_ENABLE_DEVTOOLS=false` in release builds
- Do not commit `.env`, tokens, or private keys
- Review IPC handlers for path traversal when touching filesystem code
