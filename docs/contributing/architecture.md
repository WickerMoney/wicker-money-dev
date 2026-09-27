---
sidebar_position: 2
description: Why the codebase is shaped the way it is, condensed from the project's architecture decisions.
---

# Architecture

A summary of the load-bearing decisions, condensed from the project's ADRs.
This page exists so a contributor doesn't need private repo access to
understand *why* the codebase is shaped the way it is — the full ADRs (with
performance numbers and rejected alternatives) live alongside the app's
source once a decision is ready to publish.

## PostgreSQL is a hard requirement, not a preference

Wicker Money is a thin core plus installable plugins. Each plugin declares a
`requiredTables` manifest field, and the host enforces it: a plugin that asks
for `transactions` and `categories` must not be able to reach `accounts`, and
must see only the current user's rows within the tables it *does* get.

Every mechanism that enforcement needs is PostgreSQL-specific — a
non-superuser, non-owner application role holding only DML; row-level
security policies on every table carrying `user_id`; narrow
`SECURITY DEFINER` functions for the handful of operations that necessarily
precede authentication; a `core` schema plus one `plugin_<id>` schema per
plugin. SQLite has no equivalent for row-level security, roles, schemas or
`SECURITY DEFINER` — a SQLite connection owns the whole file, so isolation
would have to be enforced in application code instead of by the database,
which is a materially larger trust surface for third-party plugin code.
`numeric(19,4)` also has no real SQLite equivalent (its `NUMERIC` is a type
*affinity*, not an exact type), and money arithmetic that's subtly wrong is
worse than arithmetic that fails loudly. So: PostgreSQL only, no SQLite tier,
now or later. A read-only SQLite *export* is unaffected — that's a data
format, not a runtime backend.

## Three layers: handler, service, repository

```
HTTP handler  ->  Service  ->  Repository
(thin: parse,     (business    (the only place SQL is written)
 call, respond)    rules)
                     |
                UnitOfWork.forUser(userId, repos => ...)
```

- **Repository** — one interface plus one Kysely implementation per aggregate.
  Methods are named operations, not generic query builders; they return plain
  rows or `undefined`, and never throw HTTP errors.
- **Service** — business rules and orchestration. Takes a `UnitOfWork`, calls
  several repositories inside one transaction, throws domain errors
  (`NotFoundError`, `ConflictError`, `ValidationError`).
- **UnitOfWork** — opens one transaction, binds the tenant context so
  row-level security applies, hands out fresh repositories over that
  transaction.

An ESLint rule enforces the boundary: files under `routes/` and `service/`
may not import Kysely or the connection helpers directly. Plugins apply the
same split internally against a host-provided query runner.

## Signed tenant context

Binding "who's making this request" to a database session setting
(`app.user_id`) isn't a boundary on its own — any SQL running in that
transaction could reset the role and overwrite the setting to impersonate
another user, and PostgreSQL can't revoke `set_config` on a custom setting
from a non-superuser role. So the tenant context is signed: every
row-level-security check verifies `app.user_id` against an HMAC-SHA256
signature (`app.user_sig`) derived from a server-side key, computed inside a
`SECURITY DEFINER` function that closes to `NULL` — meaning "matches no
row" — on any malformed or missing input, rather than raising. This costs
roughly half a millisecond per statement (measured against ~100k seeded
transactions) and protects against `RESET ROLE`, session-setting tampering,
`search_path` shadowing and signature replay across users. It does **not**
protect against a plugin that regains the application role's own table
privileges after `RESET ROLE` — that's why the current model only installs
*trusted* plugins; genuine third-party plugin isolation needs connection-level
isolation that doesn't exist yet.

## One image, one process

The API serves the built web app and the plugin remotes itself
(`WEB_DIST_DIR`), on the same origin as `/api`. This isn't a style choice —
the refresh token is a `SameSite=Strict` cookie scoped to `/api/v1/auth`, and
plugin remotes load from the same origin unless explicitly allow-listed
(`PLUGIN_REMOTE_ORIGINS`), both of which assume the UI and API share an
origin. One consequence: a reverse proxy is optional, not required, for a
self-hosted instance. See [Self-hosting](../self-hosting/quickstart) for the
practical side of this.

## Licensing boundary

`packages/plugin-sdk` and `packages/ui-kit` are Apache-2.0 — the only two
packages published to npm. Everything under `apps/*` and `plugins/*` is
AGPL-3.0-only and private (shipped only inside the container image, never
published as a package). A plugin loads via Module Federation against a
manifest-declared remote entry; it does not import from `apps/web` or
`apps/api` at build or run time.

That split is deliberate: a plugin that depends on *only* the published
`plugin-sdk`/`ui-kit` surface — no import from `apps/*`, no copying of AGPL
code — can be licensed independently, including as closed-source or paid.
A plugin that imports AGPL-covered code, or is a derivative of a bundled
plugin, stays AGPL-3.0-only. This is why the plugin contract (what lives in
`plugin-sdk` versus what stays app-internal) is treated as a licensing
decision, not just an API design one — anything a plugin needs has to be
promotable into the SDK, never the other way around.

Contributions follow inbound-equals-outbound: a change to `plugin-sdk` or
`ui-kit` is Apache-2.0, a change to the app or a bundled plugin is
AGPL-3.0-only. The project uses the
[Developer Certificate of Origin](https://developercertificate.org/) (sign
commits with `git commit -s`) rather than a CLA, so contributing doesn't
require assigning copyright or granting relicensing rights.
