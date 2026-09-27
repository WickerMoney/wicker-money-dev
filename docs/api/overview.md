---
sidebar_position: 1
description: A hand-maintained map of the API's route groups, until a generated reference exists.
---

# API reference

:::info[Not generated yet]
`apps/api` doesn't emit an OpenAPI spec today — there's no `@fastify/swagger`
wired in. The plan is `@fastify/swagger` plus
[`docusaurus-plugin-openapi-docs`](https://github.com/PaloAltoNetworks/docusaurus-openapi-docs)
to auto-generate a full interactive reference here, the same way the original
docs-platform decision intended (that plan predates the current Fastify API
and assumed ASP.NET's Swashbuckle instead — the tooling changed, the goal
didn't). Until then, this page is a hand-maintained map, not a reference.
:::

## Base path

Every route is under `/api/v1`. The API and web app share one origin (see
[Architecture](../contributing/architecture)) — there's no separate API host
to point a client at.

## Authentication

- Access tokens are short-lived (15 minutes by default) and sent by the
  client.
- The refresh token is an HttpOnly, `SameSite=Strict` cookie scoped to
  `/api/v1/auth`, rotated on every use. Presenting an already-used refresh
  token revokes the whole session as suspected theft.
- `POST /api/v1/auth/register` can be disabled per-instance
  (`REGISTRATION_ENABLED=false`) once your accounts exist.

## Feature areas

Route groups that exist today, by source directory
(`apps/api/src/<area>/routes`) — endpoint-level detail is what the generated
reference above will cover:

| Area | Covers |
|---|---|
| `auth` | Register, login, logout, refresh, change password, current user |
| `accounts` | Accounts, balances, migrating an account's type, usage |
| `transactions` | Transactions and splits |
| `categories` | Categories, category rules, rule preview |
| `onboarding` | First-run / starter setup |
| `settings` | Instance and account settings |
| `plugins` | Plugin registry — what's installed, enabled |
| `core` | Shared/cross-cutting core routes |

Bundled plugins (budgets, import-csv, and others as they ship) register their
own routes under the same plugin-host mechanism described in
[Architecture](../contributing/architecture) — they aren't core API surface,
and aren't listed here.

## In the meantime

Reading the Zod schemas next to each route handler
(`apps/api/src/*/routes/schemas/`) is the most accurate source of truth right
now — they're also what would feed the generated OpenAPI spec once that's
wired up.
