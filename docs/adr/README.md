# Architecture Decision Records

This folder records the significant decisions taken on the DyingStar Launcher, using
lightweight ADRs ([Michael Nygard format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)),
on the model of [`DyingStar-game/adminpanel`](https://github.com/DyingStar-game/adminpanel/tree/develop/docs/adr).

## Conventions

- One file per decision: `NNNN-short-title-in-kebab-case.md` (4-digit sequence, never reused).
- Start from [`template.md`](./template.md).
- Statuses: `Proposed` → `Accepted` | `Rejected`; later `Deprecated` or `Superseded by NNNN`.
- An accepted ADR is not rewritten: write a new ADR that supersedes it.
- **An accepted ADR is binding, to the letter.** Reread the ADRs of an area before working in
  it and check each of their rules before calling the work done: lint and typecheck enforce
  only part of them.
- Written in English, like code comments; ADRs are not translated into `docs/fr/`.

## Index

| #                                               | Title                                                                     | Status                                   | Date       |
| ----------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- | ---------- |
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions                                             | Proposed                                 | 2026-10-10 |
| [0002](./0002-makefile-tooling.md)              | Local tooling: a host Makefile over the pnpm scripts                      | Accepted (versions superseded by 0006)   | 2026-10-10 |
| [0003](./0003-process-boundaries-ipc.md)        | Process boundaries: privileged main, typed preload bridge, React renderer | Accepted (retroactive)                   | 2026-10-10 |
| [0004](./0004-two-game-environments.md)         | Two game environments, configured at build time                           | Accepted (retroactive)                   | 2026-10-10 |
| [0005](./0005-keycloak-pkce-authentication.md)  | Authentication: Keycloak PKCE in an in-app window, per environment        | Accepted (retroactive)                   | 2026-10-10 |
| [0006](./0006-toolchain-versions.md)            | Toolchain versions: Node 24, pnpm 12, Electron 44                         | Proposed                                 | 2026-10-10 |
| [0007](./0007-social-player-side.md)            | Social, player side: wire the existing UI to the `social` service         | Accepted (add friend superseded by 0008) | 2026-10-10 |
| [0008](./0008-player-search-screen.md)          | Player search screen to add friends                                       | Accepted                                 | 2026-10-10 |
