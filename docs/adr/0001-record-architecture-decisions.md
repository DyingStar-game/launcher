# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-10
- **Scope:** Project-wide

## Context

The launcher is an open-source community project. Contributors come and go, and the reasons
behind design choices (main / preload / renderer boundaries, per-environment configuration,
auth and install flows) get lost in chat history and PR threads. Other DyingStar repositories,
starting with [`adminpanel`](https://github.com/DyingStar-game/adminpanel/tree/develop/docs/adr),
already record their decisions as ADRs.

## Decision

We will record significant decisions as ADRs in `docs/adr/`, following the conventions in
[`README.md`](./README.md). Analysis comes first: an ADR is drafted as `Proposed`, discussed,
then `Accepted` before implementation starts.

## Consequences

- Each feature branch may add one or more ADRs alongside its code.
- Reviewers can check an implementation against its accepted ADR.
- Existing structural choices are undocumented; they can be recorded retroactively as ADRs
  when an area is next touched.
- Small cost: writing a short document for each non-trivial decision.
