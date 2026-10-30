---
sidebar_position: 2
description: Every environment variable the API reads — what it does, its default, and why it matters.
---

# Configuration reference

Every environment variable the API reads, grouped the way
[`.env.example`](https://github.com/wickermoney/wicker-money/blob/main/.env.example)
is grouped. Required variables have no default and the API refuses to start
without them.

## App

| Variable | Default | Notes |
|---|---|---|
| `NODE_ENV` | `development` | `production` inside the container image. |
| `PORT` | `8080` | |
| `HOST` | `0.0.0.0` | |

## Database

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | *required* | The app connects as `wickermoney_app` — a non-superuser, non-owner role. Row-level security is unconditionally bypassed by superusers, so this is load-bearing, not a convention. |
| `DATABASE_OWNER_URL` | *required* | Same database, connected as the owner. Only used for migrations (creating schemas, policies, `SECURITY DEFINER` functions) — never for reading application data, and never a "migrate from" source. |
| `APP_DB_PASSWORD` | *required* | Migrations create `wickermoney_app` as `NOLOGIN` with no password (a migration file is the wrong place for a secret) and grant `LOGIN` using this value. Must match the password in `DATABASE_URL`. A placeholder such as `CHANGE_ME` is refused in production (see [Placeholder credentials](./upgrading#placeholder-credentials)). |
| `APP_DB_ROLE` | `wickermoney_app` | Override only when several environments share one PostgreSQL *server* — roles are cluster-wide, so two environments reusing a role name means whichever migrated last owns the password. |
| `DB_POOL_MAX` | `10` | *0.6.0 and later.* Connections the API may hold open to PostgreSQL, 2 to 200. See [Pool, statement timeouts and the import limit](#pool-statement-timeouts-and-the-import-limit). |
| `DB_STATEMENT_TIMEOUT` | `30000` | *0.6.0 and later.* Longest one SQL statement may run, in **milliseconds** (1000 to 3600000). |
| `DB_LONG_STATEMENT_TIMEOUT` | `300000` | *0.6.0 and later.* The same limit, in milliseconds, for CSV import and the data export. Not lower than `DB_STATEMENT_TIMEOUT`. |
| `IMPORT_MAX_ROWS` | `100000` | *0.6.0 and later.* The most data rows one CSV import may contain, 1 to 1000000. |
| `IMPORT_MAX_CONCURRENT` | half of `DB_POOL_MAX` | *0.7.0 and later.* CSV imports one API process commits at once, 1 to 1000; the others wait their turn. Blank or unset means half the pool, at least 1. |
| `IMPORT_QUEUE_WAIT_SECONDS` | `30` | *0.7.0 and later.* The longest, in **seconds** (0 to 600), an import waits for its turn before it is refused with `503 import_busy`. |

## Pool, statement timeouts and the import limit

*Added in 0.6.0; the last two settings in the table, in 0.7.0.* Six settings
bound how much database work one API process does. Each is read at start-up and checked: a value outside its range
stops the API with a configuration error that names the variable, rather than
being clamped.

| Setting | Default | Range | What it does |
|---|---|---|---|
| `DB_POOL_MAX` | `10` | 2 to 200 | Connections the API may hold open. Every request holds one for the length of its transaction, so this caps concurrent database work in one API process. PostgreSQL's `max_connections` must cover it for every API process you run, plus migrations and your own tools. |
| `DB_STATEMENT_TIMEOUT` | `30000` | 1000 to 3600000 | Longest one SQL statement may run, in **milliseconds**. A statement over the limit is cancelled and the request fails with the generic error; the cause is in the log. The floor of 1000 is deliberate: `30`, meant as seconds, is refused rather than cancelling nearly every query. |
| `DB_LONG_STATEMENT_TIMEOUT` | `300000` | 1000 to 3600000 | The same limit for the routes that legitimately run longer: CSV import (including waiting its turn behind another import into the same account) and the data export. It is set inside those routes' transactions, so it ends with them; every other route keeps `DB_STATEMENT_TIMEOUT`. It must not be lower than `DB_STATEMENT_TIMEOUT`. |
| `IMPORT_MAX_ROWS` | `100000` | 1 to 1000000 | The most data rows one CSV import may contain, counting rows that can't be read. A larger file is refused with `400 too_many_rows` and a message that names the limit, before anything is written. |
| `IMPORT_MAX_CONCURRENT` | half of `DB_POOL_MAX`, at least 1 | 1 to 1000 | *0.7.0 and later.* CSV imports this API process commits at once. Blank or unset uses the default. A value at or above `DB_POOL_MAX` has no effect, because the pool then limits imports first. See [Concurrent imports](#concurrent-imports). |
| `IMPORT_QUEUE_WAIT_SECONDS` | `30` | 0 to 600 | *0.7.0 and later.* The longest an import waits for its turn, in **seconds**, before it is refused with `503 import_busy` and a `Retry-After` header. `0` refuses at once when every slot is busy. |

The 8 MB limit on the CSV file itself applies as well and isn't configurable.
Before this release the row cap was a fixed 50,000.

### Why the import cap is 100,000 rows

An 8 MB file holds about 109,000 rows of a typical bank export, 67,000 with a
memo column, or 374,000 rows of minimal text, so the file size alone doesn't
bound the work. An import is parsed in the API process and holds one database
connection for its whole commit. The maintainer measured this on 2 vCPUs with a
local PostgreSQL 16, a pool of 10 and synthetic rows:

| Rows | Analyze | Commit | Extra API memory (analyze / commit) |
|---|---|---|---|
| 50,000 | 0.5 s | 7 to 9 s | +92 / +107 MB |
| 100,000 | 1.0 s | about 17 s | +190 / +110 MB |
| 373,585 (an 8 MB file of minimal rows) | 2.1 s | about 48 s | +194 / +317 MB |

Commit time is linear in the row count, about 150 microseconds a row, mostly
PostgreSQL. These are one machine's numbers, not a benchmark; the shape is the
useful part. 100,000 rows keeps a commit near 15 to 18 seconds there, which
leaves a slower host room under a reverse proxy that cuts requests off at 60
seconds (the nginx default). On a small device, or behind a proxy with a
short timeout, lower `IMPORT_MAX_ROWS`; raise it only if you also raise the
proxy's timeout.

### Concurrent imports

*Added in 0.7.0.* A commit holds one pooled database connection for its whole
length, so before 0.7.0 a few large files at once could take every connection.
On the maintainer's two-vCPU test machine, ten people committing 50,000 rows at
the same moment held all ten connections of a pool of 10 for about 50 seconds,
and 319 of 402 other requests made in that time failed waiting for a
connection.

Now a process commits at most `IMPORT_MAX_CONCURRENT` imports at once. An import
over the limit waits for its turn **before** it reads the file or opens its
transaction, so it holds no connection while it waits, and the rest of the app
keeps the other half of the pool. If it has not had its turn after
`IMPORT_QUEUE_WAIT_SECONDS`, it is refused with `503`, code `import_busy`, a
`Retry-After` header and a message that says nothing was imported. The Import
page shows that message and keeps the review, and sending the same file again
imports it once (a repeated commit carries the same idempotency key).

- **One person importing alone is not slowed down.** A 100,000-row commit took
  15.2 seconds with the limit and 14.5 without.
- **Measured, ten 50,000-row commits at once on a pool of 10, two vCPUs:** with
  the default (a limit of 5 and a 30 second wait) none of 358 other requests
  failed and all ten imports finished, the last after about 45 seconds. With
  `IMPORT_QUEUE_WAIT_SECONDS=0`, five finished in about 21 seconds and five were
  refused in about 1.6 seconds, and none of 168 other requests failed. These are
  one machine's numbers, taken in a container shared with other work; the shape
  is the useful part.
- **Why 30 seconds.** A wait plus a commit (about 17 seconds for 100,000 rows)
  stays under the 60 seconds that nginx waits by default. Set `0` if you would
  rather see the refusal than wait.
- **Per process.** The limit is per API process, and each process has its own
  pool, so two API instances allow twice the imports. With several, set
  `IMPORT_MAX_CONCURRENT` from the pool and PostgreSQL's `max_connections`
  per instance.
- **`analyze` is not held back by it.** It holds a connection only for its one
  read. The [API rate limit](#api-rate-limit) does count it, in the import
  bucket.

`analyze` no longer returns every row of the file; see
[Import](../api/overview#import-csv) in the API reference.

### Running behind PgBouncer

You only need a pooler if you want more API connections than PostgreSQL should
hold. Nothing in the app depends on a session (the tenant binding and the role
switch end with the transaction, and the import lock is a transaction-level
advisory lock), so PgBouncer in **transaction** mode works with one change.
It was tested with PgBouncer 1.22.0, `default_pool_size = 4` under the API's
pool of 10, and the full integration suite run through it.

1. **Let the startup parameters through.** The API sends `statement_timeout`
   and `idle_in_transaction_session_timeout` as connection startup parameters.
   PgBouncer refuses them (`unsupported startup parameter`) and the API can't
   connect. Add this to `pgbouncer.ini`:

   ```ini
   ignore_startup_parameters = statement_timeout,idle_in_transaction_session_timeout
   ```

2. **Put the two limits on the role instead.** Once ignored, those limits no
   longer apply through the pooler, whatever `DB_STATEMENT_TIMEOUT` says. Set
   them on the application role (`wickermoney_app`, or the name in
   `APP_DB_ROLE`), then reconnect PgBouncer's server connections
   (`RECONNECT`) so new ones pick them up:

   ```sql
   ALTER ROLE wickermoney_app SET statement_timeout = '30s';
   ALTER ROLE wickermoney_app SET idle_in_transaction_session_timeout = '60s';
   ```

   `DB_LONG_STATEMENT_TIMEOUT` still applies, because it is set inside the
   transaction; it overrides the role's value for import and export.

With both in place, 1,011 of 1,014 integration tests passed. The three that
didn't check the pool's own default limit, which is the ignored parameter in
step 1, not a data problem.

**Not tested:** session or statement pool modes (statement mode can't work,
because transactions span statements), other PgBouncer versions, other
poolers, any production load. Run **migrations** against PostgreSQL directly,
not through a pooler: point `DATABASE_OWNER_URL` at the database itself.

## Logging

| Variable | Default | Notes |
|---|---|---|
| `LOG_LEVEL` | `info` | `fatal \| error \| warn \| info \| debug \| trace \| silent`. Worth leaving at `info` or above: the API returns a generic "Something went wrong" for unexpected failures on purpose and keeps the real cause — including the PostgreSQL error code, detail and hint — only in the log. At `silent`, that's gone. |

## Auth

| Variable | Default | Notes |
|---|---|---|
| `AUTH_SECRET` | *required* | Generate with `openssl rand -base64 48`. Signs access tokens **and** derives the key that signs the per-request tenant context every row-level security policy checks. After changing it, re-run migrations before starting the API, or it refuses to boot. In production a placeholder value (`change-me`, `CHANGE_ME`, `changeme`, …) is refused: see [Placeholder credentials](./upgrading#placeholder-credentials). |
| `AUTH_ACCESS_TTL_SECONDS` | `900` | Access token lifetime (15 min). |
| `AUTH_REFRESH_TTL_SECONDS` | `2592000` | Refresh token lifetime (30 days). The refresh token is an HttpOnly, `SameSite=Strict` cookie scoped to `/api/v1/auth`, rotated on every use — presenting an already-used one revokes the whole session as suspected theft. |
| `COOKIE_SECURE` | `true` in production | Whether the refresh cookie carries `Secure` (HTTPS-only). Browsers refuse a `Secure` cookie over plain HTTP, so local development on `http://localhost` needs `false`. |
| `BOOTSTRAP_OWNER_EMAIL` | unset | *0.5.0 and later.* The address that becomes the instance's owner, compared without regard to case. It must be a valid email address; surrounding spaces are ignored, a blank value counts as unset, and anything else stops the API at start-up with a configuration error. When set, only the account registered with that address becomes the owner, even if other people registered before it; everyone else is a member. It never creates a second owner while one exists (the address then registers as a member) and never changes an existing account. When unset, the first account to register is the owner. Registration doesn't verify email addresses, so this keeps strangers from claiming a fresh instance by accident; it is not a login check. Register promptly, then set `REGISTRATION_ENABLED=false`. In production the API logs a warning at start-up when the instance has no accounts, registration is open and this is unset. See [Owners and members](../features/owners-and-members#choosing-who-the-owner-is). |
| `REGISTRATION_ENABLED` | `true` | Whether `POST /api/v1/auth/register` accepts new accounts. It takes precedence over `BOOTSTRAP_OWNER_EMAIL`: with registration closed, nobody can register, that address included. Unless `BOOTSTRAP_OWNER_EMAIL` is set, the first account registered becomes the instance's owner and every later one a member (see [Owners and members](../features/owners-and-members)); if every owner is ever demoted, the next account to register becomes the owner. Set `false` once your accounts exist. Note: while open, registering an address that already has an account returns `409 email_taken` — a deliberate tradeoff for a self-hosted instance, bounded by the rate limits below. |
| `TRUST_PROXY` | `false` | Set `true` **only** when the API runs behind a reverse proxy you control, so the rate limiter reads the real client address from `X-Forwarded-For`. Left `true` while exposed directly, clients can spoof their address and dodge every rate limit. |
| `AUTH_RATE_LIMIT_MAX` | `10` | Requests per client address per window, on each of register/login/refresh. |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | `60` | |
| `AUTH_EMAIL_RATE_LIMIT_MAX` | `5` | Stricter cap on login/registration attempts per *email address* per window, regardless of source address. |
| `AUTH_MAX_CONCURRENT_HASHES` | `4` | Argon2id hashes (~46 MiB each) computed at once; excess work queues rather than spiking memory. |

Rate limit counters live in memory — per API process, reset on restart.

## API rate limit

*Added in 0.7.0. On by default.* Every request to `/api/v1` counts against a
per-user limit, so one client in a loop (a script, a runaway tab, a stolen
token) cannot use up the whole API process. Before 0.7.0 only the sign-in routes
and the password-confirmed actions had limits.

| Variable | Default | Notes |
|---|---|---|
| `API_RATE_LIMIT_ENABLED` | `true` | `false` turns the whole limit off. The sign-in limits above are separate and stay on. |
| `API_RATE_LIMIT_MAX` | `600` | Requests per user per window, everything except CSV import and the data export. 1 to 10000000. |
| `API_RATE_LIMIT_IMPORT_MAX` | `30` | CSV import requests per user per window: `analyze` (each page of flagged rows is one request) and `commit` together. |
| `API_RATE_LIMIT_EXPORT_MAX` | `5` | Data export downloads per user per window. Each also needs a password ticket. |
| `API_RATE_LIMIT_WINDOW_SECONDS` | `60` | Length of the window, 1 to 86400. All three limits use it. |

- **Who is counted.** A request with a valid signed-in token counts against that
  user, and a plugin's token counts as the user it speaks for. A request with no
  valid token, or a forged or expired one, counts against the client address
  instead: the forwarded address when `TRUST_PROXY=true`, the connection's
  address otherwise. Behind a proxy that you have not told the API to trust,
  every request without a valid token then shares the proxy's address.
- **What is not counted.** The health checks, the web app's files and the
  plugin frame document. Only paths under `/api/v1/` count.
- **Over the limit** the API answers `429` with the code `rate_limited`, a
  message that says how many seconds to wait, and a `Retry-After` header in
  seconds. The web app shows the message like any other failed request and
  never signs anyone out for it. A refused request still counts, so retry after
  `Retry-After`, not at once.
- **The defaults are well above a person.** A scripted heavy session (sign in, a
  full dashboard, filtering and paging the ledger, importing and re-importing
  5,000 rows, one export) made 95 requests in 63 seconds, 87 in its busiest
  minute. The web app makes no periodic requests, so an idle tab adds none.
  That is one machine, one account and one pace.
- **Upgrade note: a script that calls the API in a loop may now get `429`s.**
  A sync, a poller or a bulk loader is the usual case. Raise
  `API_RATE_LIMIT_MAX` (and `API_RATE_LIMIT_IMPORT_MAX` and
  `API_RATE_LIMIT_EXPORT_MAX` if it imports or exports), or set
  `API_RATE_LIMIT_ENABLED=false`. The limit is per user, so one script does not
  slow anyone else. There is no per-script setting.
- **Per process.** The counters are in the API process's memory and reset on
  restart. With more than one API instance each counts on its own, so a client
  can make up to that many times the limit. A store shared between instances is
  not built.
- **It composes with the other limits.** The rate limit counts requests and runs
  first. The [import limit](#concurrent-imports) caps commits in flight. The
  sign-in and password-attempt limits keep their own counters, and a request can
  be counted by this limit and by one of them. A request refused here never
  reaches the database or takes an import slot.

## Web app

| Variable | Default | Notes |
|---|---|---|
| `WEB_DIST_DIR` | unset | Directory holding the built web app. When set, the API serves the UI and the plugin remotes itself, on the same origin as `/api` — which the refresh cookie and same-origin plugin loading both rely on. The container image sets this to `/app/web`; leave it unset in development, where Vite serves the UI on `:5173` and proxies `/api` to the API. |
| `PLUGIN_REMOTE_ORIGINS` | unset | Comma-separated `https` origins that a third-party plugin's front-end code may load from, beyond the app's own origin. Leave it empty unless you have chosen to run a plugin from that origin. A plugin from a listed origin runs only in a sandboxed frame, never in the app's own page, and only against an integrity pin in its manifest; the origin is added to the frame's content security policy only, not the page's. A plugin granted your transactions can still send them out through the known gaps in the sandbox (see [How much a plugin is trusted](../features/plugins#how-much-a-plugin-is-trusted)). |
| `PLUGIN_MANIFEST_DIR` | unset | *0.6.0 and later.* A directory of third-party plugin manifests (`*.json`), read once at start-up; restart the API after changing it. Each manifest is checked like any other, registered **switched off**, and run only in a frame. A manifest that declares `endpoints` or `exporters`, a permission the host doesn't implement, an origin that isn't in `PLUGIN_REMOTE_ORIGINS`, or no `integrity` pin covering its entry file is refused, and the reason is listed with the plugin. Unset, nothing changes. There is no install flow; see [Adding a third-party plugin](../features/plugins#adding-a-third-party-plugin-experimental). |

## Reverse proxy notes

Wicker Money is one process on one port by design — the API serves the built
web app and the plugin remotes itself, so a reverse proxy is optional, not
required. If you do put one in front (for TLS termination, a shared ingress,
etc.), set `TRUST_PROXY=true` and forward `X-Forwarded-For`.

### Compression: don't compress twice

*Added in 0.6.0.*

The API compresses its own responses, because the image serves the web bundle
and the API from one process with no proxy guaranteed in front. It uses brotli
(quality 5) or gzip, whichever the client accepts, for responses over 1 KiB,
and skips types that are already dense, such as images and fonts. A compressed
response carries `Content-Encoding` and `Vary: Accept-Encoding`; nothing else
about it changes. On the seeded demo data, a 200-row transactions page went
from 103 kB to 8.7 kB with brotli (9.6 kB with gzip).

**Behind a reverse proxy, do not compress twice.** Leave compression off for
this upstream, or make sure your proxy passes a response that already has a
`Content-Encoding` header through untouched. Compressing an already-compressed
body costs CPU for nothing. There is no setting in this release to turn the app's own
compression off, so the proxy is where to configure it.
