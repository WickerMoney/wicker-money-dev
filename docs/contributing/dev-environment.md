---
sidebar_position: 1
description: Set up a local dev environment and learn the ground rules before your first pull request.
---

# Dev environment

## Before you start

Wicker Money is pre-1.0 with a single maintainer. Right now the project is
accepting **issues and suggestions**, not feature pull requests — the plugin
contract isn't frozen, and third-party plugin install isn't supported yet, so
most outside code would need reworking once it lands. Typo, docs and small
bug-fix PRs are welcome. Open an issue before working on anything larger than
a small fix — it saves a pull request that doesn't end up fitting.

**Core versus plugin:** core owns identity, money movement and the app shell.
Anything that *interprets* money (budgets, forecasting, importers) belongs in
a plugin. If you're not sure which yours is, ask in the issue.

## Requirements

- Node 22.22.2+ or 24.15+ (`pnpm install` refuses older versions)
- pnpm 10 (`corepack enable pnpm`, or `npx pnpm@10` if you'd rather not touch
  corepack)
- Docker, for a local PostgreSQL

## Setup

```bash
git clone https://github.com/wickermoney/wicker-money.git
cd wicker-money
pnpm install

# Local PostgreSQL for development and tests
docker compose -f docker/docker-compose.dev.yml up -d
cp .env.example .env
# .env needs at minimum AUTH_SECRET — generate with: openssl rand -base64 48

pnpm build
pnpm test
```

| Command | What it does |
|---|---|
| `pnpm dev` | Runs the API and web app in watch mode |
| `pnpm lint` | ESLint across the workspace |
| `pnpm typecheck` | `tsc --noEmit` in every package |
| `pnpm build` | Builds packages, then apps |
| `pnpm test` | Unit tests in every package — no database needed |
| `pnpm test:integration` | API integration tests against a real PostgreSQL (files named `*.integration.test.ts`) |

## The database, briefly

The API connects as `wickermoney_app` — a role that is **not** a superuser and
owns nothing. This is load-bearing: a superuser bypasses row-level security
unconditionally, which would make every isolation policy a no-op and any test
of it a false pass. Migrations connect separately, as the owner
(`DATABASE_OWNER_URL`), since creating schemas, policies and functions needs
privilege the app role deliberately lacks. Both URLs address the *same*
database — only the connecting role differs.

See [Configuration reference](../self-hosting/configuration) for the full
list of `.env` variables, and [Architecture](./architecture) for why the
database looks like this at all.

## Conventions worth knowing before your first PR

- Money is `numeric(19,4)` in PostgreSQL and `string` in TypeScript. Never
  `number` — floating point and currency don't mix.
- [Conventional Commits](https://www.conventionalcommits.org/) for commit
  subjects (`feat:`, `fix:`, `docs:`, `chore:` …) — release notes are built
  from them.
- Tests that touch data isolation run against a real PostgreSQL
  (`pnpm test:integration`), not a mock.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` must pass before a PR is
  reviewed.

See [Coding conventions](./coding-conventions) for the architectural rules
(layering, lint guards) that CI actually enforces, and
[Pull requests](./pr-guide) for how review and licensing work.
