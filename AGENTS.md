# GeoQuest agent guide

This file applies to the whole repository. The normative product rules are in [`docs/PROJECT_CONSTRAINTS.md`](docs/PROJECT_CONSTRAINTS.md); do not duplicate or weaken them in local instructions.

## Working rules

- Keep the public repository free of textbook/standards source files, scans, internal page locators, private review evidence, machine paths, credentials, and unapproved map or media assets.
- Treat the legacy eight `reviews` fields as optional compatibility metadata. Published topics require a matching `aiReview` record and deterministic checks; never fabricate AI evidence or legal permission.
- Do not add accounts, cloud learning records, runtime AI endpoints, analytics, cookies, advertising, third-party tracking, or a runtime dependency on an external teaching API.
- Use pnpm for Node dependencies and scripts. Use UV for any Python environment or data-processing tool.
- Use an SSH GitHub remote for pushes. Stage explicit public paths, inspect the staged diff, and run the boundary check; do not use an indiscriminate initial `git add .`.
- Keep TypeScript strict, content build-time validated, theme/map/chart modules lazy-loaded, and classroom mode functional offline from the same snapshot as explore mode.
- Do not publish production source maps that embed authoring manifests, review fields, or internal build sources.
- Treat content, map, data, copyright, privacy, accessibility, and technical validation as separate checks. An AI check records evidence but cannot grant a license or replace a legal requirement.

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
