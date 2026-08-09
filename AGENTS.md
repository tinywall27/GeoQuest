# GeoQuest agent guide

This file applies to the whole repository. The normative product rules are in [`docs/PROJECT_CONSTRAINTS.md`](docs/PROJECT_CONSTRAINTS.md); do not duplicate or weaken them in local instructions.

## Working rules

- Keep the public repository free of textbook/standards source files, scans, internal page locators, private review evidence, machine paths, credentials, and unapproved map or media assets.
- Never infer or auto-assign an `approved` review. Approval requires a named reviewer, date, and evidence recorded in the private review system.
- Do not add accounts, cloud learning records, AI endpoints, analytics, cookies, advertising, third-party tracking, or a runtime dependency on an external teaching API in V1.
- Use pnpm for Node dependencies and scripts. Use UV for any Python environment or data-processing tool.
- Use an SSH GitHub remote for pushes. Stage explicit public paths, inspect the staged diff, and run the boundary check; do not use an indiscriminate initial `git add .`.
- Keep TypeScript strict, content build-time validated, theme/map/chart modules lazy-loaded, and classroom mode functional offline from the same snapshot as explore mode.
- Do not publish production source maps that embed authoring manifests, review fields, or internal build sources.
- Treat content, map, data, copyright, privacy, accessibility, and technical review as separate release gates. Passing tests does not approve content.

## Before handing off a change

Run the relevant subset of:

```text
pnpm check:boundary
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
```

For content changes, also run the content validator and verify both `/topics/:slug` and `/topics/:slug?mode=classroom`. For dependency or asset changes, record the source, license, attribution, and offline fallback before requesting review.
