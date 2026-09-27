---
sidebar_position: 3
description: The TypeScript, testing, and lint rules CI actually enforces.
---

# Coding conventions

Most of these are enforced by CI (`pnpm lint`, `pnpm typecheck`, `pnpm test`),
not just documented — if you can get a PR past those three, you've already
satisfied most of this page.

## TypeScript

`tsconfig.base.json` runs `strict` plus a few settings stricter than the
default:

- `noUncheckedIndexedAccess` — indexing an array or record gives you
  `T | undefined`, not `T`. This catches a real class of bugs at the type
  level (a lookup that silently returns `undefined` treated as present).
- `noImplicitOverride` — overriding a base method requires the `override`
  keyword.
- `verbatimModuleSyntax` — type-only imports must say so
  (`import type { Foo }`), which ESLint's
  `@typescript-eslint/consistent-type-imports` also enforces.

Money is `numeric(19,4)` in PostgreSQL and `string` in TypeScript — never
`number`. Floating-point and currency don't mix, and this is the one rule in
this document that's about correctness rather than style.

## Architecture guards (ESLint)

Two rules exist specifically to keep the layering in
[Architecture](./architecture) real rather than aspirational:

- Files under `apps/api/src/**/routes/**` and `apps/api/src/**/service/**`
  can't import Kysely or the connection helpers directly — a handler or
  service that needs new data access gets a repository method, not a raw
  query. (Sanctioned exceptions: the plugin host adapter and the DB
  connectivity healthcheck, which are infrastructure that hands out a
  connection or checks reachability, not business logic.)
- Browser code (`apps/web`, plugins, `packages/*`) can't call
  `crypto.randomUUID` directly — it only exists over HTTPS or `localhost`,
  and Wicker Money is meant to also run over plain HTTP on a LAN. Use
  `newUuid()` instead, which falls back to `getRandomValues`.

## Testing

- **Unit tests** (`pnpm test`) — no database. Services are tested against
  in-memory fakes of their repositories.
- **Integration tests** (`pnpm test:integration`) — files named
  `*.integration.test.ts`, run against a real PostgreSQL with row-level
  security actually enabled. Anything touching tenant isolation belongs here,
  not behind a mock — a mock can't catch a policy that's missing or wrong.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) for commit
subjects — `feat:`, `fix:`, `docs:`, `chore:`, etc. Release notes are
generated from them, so an inaccurate prefix produces an inaccurate changelog
entry, not just a style nit.

## Formatting

ESLint runs on save/CI (`eslint.config.mjs`, flat config); there's no separate
Prettier pass documented here yet — if your editor already formats on save
against the ESLint config, you're set.
