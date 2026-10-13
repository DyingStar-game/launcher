# 0022. Forms with React Hook Form and Zod

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Renderer forms, shared validation
- **Builds on:** [ADR 0011](./0011-atomic-design.md) (where components live),
  [ADR 0003](./0003-process-boundaries-ipc.md) (main validates what crosses IPC)

## Context

The launcher has one form, `CreateOrganisationForm`, written with `useState` per field and
hand-made checks. ADR 0020 and ADR 0021 add several larger ones (profile, organisation details,
ranks), each with the `social` service's limits to enforce, "changed fields only" saving and a
submit state.

The [adminpanel](https://github.com/DyingStar-game/adminpanel/blob/develop/docs/adr/0010-frontend-stack.md)
builds its forms with **React Hook Form** and `@hookform/resolvers/zod`: one Zod schema per form,
`useForm({ resolver: zodResolver(schema), defaultValues, mode: 'onChange' })`, the changed
fields compared with the initial values. The maintainer (2026-10-10) wants the same here.

## Options considered

1. **Keep `useState` forms** — no dependency, but every form re-implements validation, dirty
   tracking and submit state.
2. **React Hook Form + Zod**, as the adminpanel — one way to write a form, validation declared
   once and reusable by main.

## Decision

Option 2.

- **Dependencies**: `react-hook-form`, `@hookform/resolvers`, `zod`, in their latest major
  (ADR 0006: everything else, latest within the current major).
- **Schemas** live in `src/shared/schemas/` (e.g. `social.ts`): the renderer uses them in
  `zodResolver`, main parses the IPC payload with the same schema before calling the service, so
  a limit is written once. Limits are the service's, with the commit they were checked against.
  Messages are i18n keys, translated where shown.
- **Form organisms** own `useForm` (`resolver: zodResolver(schema)`, `defaultValues` from the
  loaded data, `mode: 'onChange'`); the submit button is disabled while the form is invalid or
  not dirty, and uses `Button loading` while submitting (ADR 0018). Only dirty fields are sent
  (`formState.dirtyFields`).
- **Fields** stay presentational molecules (`InputField`, the new `TextareaField`, a
  `SelectField` / `CheckboxField` when needed), wired with `register` or `Controller`; they
  receive `error` as an already translated string. Molecules do not import `react-hook-form`.
- `CreateOrganisationForm` moves to this pattern in the same change; no `useState` form
  remains. A search box that filters as you type is not a form and stays as it is.
- Each schema has its `*.test.ts`; each form organism its `*.test.tsx` (valid / invalid /
  unchanged / submit).

## Consequences

- One pattern for every form, the same as in the adminpanel.
- Three runtime dependencies in the renderer, and Zod in main.
- Shared schemas must stay free of renderer or Node imports (both processes use them).
