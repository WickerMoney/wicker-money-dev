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

## Web app

| Variable | Default | Notes |
|---|---|---|
| `WEB_DIST_DIR` | unset | Directory holding the built web app. When set, the API serves the UI and the plugin remotes itself, on the same origin as `/api` — which the refresh cookie and same-origin plugin loading both rely on. The container image sets this to `/app/web`; leave it unset in development, where Vite serves the UI on `:5173` and proxies `/api` to the API. |
| `PLUGIN_REMOTE_ORIGINS` | unset | Additional origins plugin remotes may load from, beyond the app's own origin. Leave it empty unless you fully trust every origin you list: plugin code loaded from one runs inside the app with the signed-in user's full access to the API, and a plugin's table grants don't restrict it (see [How much a plugin is trusted](../features/plugins#how-much-a-plugin-is-trusted)). Feeds directly into the `script-src`/`connect-src` Content-Security-Policy. |

## Reverse proxy notes

Wicker Money is one process on one port by design — the API serves the built
web app and the plugin remotes itself, so a reverse proxy is optional, not
required. If you do put one in front (for TLS termination, a shared ingress,
etc.), set `TRUST_PROXY=true` and forward `X-Forwarded-For`.
