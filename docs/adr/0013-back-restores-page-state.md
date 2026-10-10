# 0013. Back restores where the player was

- **Status:** Accepted
- **Date:** 2026-10-10
- **Deciders:** maintainer
- **Scope:** Navigation, social
- **Extends:** [ADR 0012](./0012-sheets-as-pages.md)

## Context

Back (ADR 0012) returns to the previous page, but pages keep their UI state in React state:
coming back to the social page shows the friends tab again, an empty player search, the top
of the list. The maintainer asked (2026-10-10) that Back return **where the player was**.

## Decision

- Each history location carries a **page state** (`pageState`, a small key → value record) next
  to its view and subject. Pages read and write it with `usePageState(key, initial)`; Back
  restores it, a navbar link or the environment switch starts empty.
- Kept today:
  - social page: the open **tab** and the **player search** text (results are searched again);
  - **scroll position** of the scrolling lists and pages (`useScrollMemory(key, ready)`), saved
    while scrolling, restored once the content is there;
  - organisation page: how many **members** were loaded; they are loaded again, 50 at a time,
    before the scroll position is restored.
- The organisation directory search already lives in the social store (per env) and stays there.
- Writing a page state does not re-render components that do not read that key.

## Consequences

- Coming back from a sheet shows the same tab, search and position.
- Data is fetched again on return (search results, members), so it is current; a long member
  list costs one request per 50 members.
- Page state lives in memory with the history; a launcher restart starts fresh.
