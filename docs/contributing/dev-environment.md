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
| `pnpm dev` | Runs the API and web app in watch mode. Plugin frames need a built web app first: see [the dev server and plugin frames](#the-dev-server-and-plugin-frames) |
| `pnpm lint` | ESLint across the workspace |
| `pnpm typecheck` | `tsc --noEmit` in every package |
| `pnpm build` | Builds packages, then apps |
| `pnpm test` | Unit tests in every package — no database needed |
| `pnpm test:integration` | API integration tests against a real PostgreSQL (files named `*.integration.test.ts`) |

## The dev server and plugin frames

*Changed in NEXT_VERSION.* Most of the bundled plugins run in sandboxed frames
(Insights, Spending Trends, Upcoming, Forecast and Debt payoff; Budgets and
Import CSV still run in the app's own page). A frame is a separate document that
the **API** serves with its own content security policy and sandbox, not
something Vite can serve, so in `pnpm dev` the dev server forwards
`/plugin-frame`, `/assets` and a frame's requests for `/plugins` to the API on
port 8080. The frame then gets the same policy, sandbox and CORS headers it has
in production.

That needs a built copy of the web app for the API to serve. Once:

```bash
pnpm --filter @wickermoney/web build   # makes apps/web/dist, with plugin-frame.html
# in .env, uncomment WEB_DIST_DIR=../web/dist (relative to apps/api)
pnpm dev
```

The API then also serves the built app on port 8080, which you can ignore.

- **A frame runs the built copy of its code.** There is no hot reload inside it.
  After you change the frame runtime (`apps/web/src/frame`), the SDK's isolated
  entry point, or a plugin that runs in a frame, run the build line again and
  reload. Plugins that run in the app's own page are unchanged: Vite serves them
  from `apps/web/public/plugins`, which their watch builds rewrite.
- **Without the proxy and the build,** a widget shows "The plugin did not start
  in time" and the console has CORS errors for `/@vite/client` and the frame's
  modules, because Vite would answer `/plugin-frame` with its own page and no
  policy. If a frame still fails to start, the console names the likely cause: no
  built frame, the API not running, or something other than the API answering
  `/plugin-frame`.
- **Don't "fix" it by setting `server.cors` to the origin `null`.** That makes the
  widgets load, but `null` is the origin of every sandboxed iframe on any site,
  so any page open in the same browser could then read the dev server's source.
  The frame would also be Vite's document with no policy, so it could do in
  development what production refuses.
- **To exercise the sandbox itself,** run
  `pnpm --filter @wickermoney/web test:browser`. It builds a fixture plugin that
  tries to escape and drives Chromium through the real API. It is not part of
  `pnpm test`.

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
