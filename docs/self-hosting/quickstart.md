---
sidebar_position: 1
description: Run your own Wicker Money instance with Docker, from pulling an image to your first login.
---

# Quickstart

Run your own Wicker Money instance with Docker. This assumes an existing
PostgreSQL 16+ server — Wicker Money requires PostgreSQL specifically (not
SQLite or MySQL) because tenant isolation between plugins is enforced with
row-level security, roles and schemas that only PostgreSQL has.

## 1. Get an image

```bash
docker pull ghcr.io/wickermoney/wicker-money:latest
```

:::tip[Pin a version once plugins are in the picture]
`:latest` is fine for a quick look. For anything you'll actually keep
running, pin a specific tag instead — for example
`ghcr.io/wickermoney/wicker-money:0.1.0` — and bump it deliberately. Bundled
plugins ship inside the same image, so an unpinned `:latest` can silently
change which plugin versions (and which `SDK_MAJOR_VERSION` they expect) you're
running on your next pull, instead of only when you choose to upgrade. See
[Upgrading](./upgrading) for how the app version and the plugin contract
version relate.
:::

## 2. Create the network and volume

The sample compose file expects both to already exist, so a reverse proxy (or
anything else) can share the same network without editing the compose file:

```bash
docker network create wickermoney_default
docker volume create wickermoney_data
```

## 3. Configure

Copy [`docker/docker-compose.sample.yml`](https://github.com/wickermoney/wicker-money/blob/main/docker/docker-compose.sample.yml)
to `docker-compose.yml` and create a `.env` next to it:

```bash title=".env"
DATABASE_URL=postgresql://wickermoney_app:CHANGE_ME@your-postgres-host:5432/wickermoney
DATABASE_OWNER_URL=postgresql://wickermoney:CHANGE_ME@your-postgres-host:5432/wickermoney
APP_DB_PASSWORD=CHANGE_ME
AUTH_SECRET=
```

Generate `AUTH_SECRET` with `openssl rand -base64 48`. It signs access tokens
*and* derives the key that signs the per-request tenant context every
row-level security policy checks — treat it like a database credential, not a
cosmetic setting.

`DATABASE_URL` and `DATABASE_OWNER_URL` point at the **same** database as two
different roles, deliberately. The app connects as `wickermoney_app` — a
non-superuser, non-owner role — because a superuser bypasses row-level
security unconditionally, which would make every isolation policy decorative.
Migrations need the owner role's privileges (creating schemas, policies,
`SECURITY DEFINER` functions), which the app role deliberately doesn't have.

See [Using an existing PostgreSQL server](#using-an-existing-postgresql-server)
below if you don't have a database yet.

## 4. Run migrations

The image doesn't migrate on start — on purpose, since that would mean the
running API needs owner credentials, which it deliberately doesn't have:

```bash
docker run --rm --env-file .env wickermoney node dist/db/cli.js up
```

## 5. Start it

```bash
docker compose up -d
```

By default the app listens on `http://localhost:8180` (override with
`HOST_PORT`). If you're putting a reverse proxy in front, set `TRUST_PROXY=true`
— without it, every request appears to come from the proxy's address, and the
per-address auth rate limits apply to everyone behind it collectively instead
of individually.

## Using an existing PostgreSQL server

Wicker Money expects a database named `wickermoney`, created and owned by a
role with `CREATEROLE` (migrations create the `wickermoney_app` role):

```sql
CREATE ROLE wickermoney LOGIN PASSWORD 'pick-something' CREATEROLE;
CREATE DATABASE wickermoney OWNER wickermoney;
```

Without `CREATEROLE`, migrations fail with *"Only roles with the CREATEROLE
attribute may create roles."* Check first:

```sql
SELECT current_database(), current_user,
       (SELECT rolcreaterole FROM pg_roles WHERE rolname = current_user) AS can_create_roles;
```

## Resetting a password

There's no mail server on a self-hosted instance, so there's no reset link to
send — reset from the machine running the API instead:

```bash
docker exec -it <container> node dist/auth/reset-cli.js you@example.com --generate
```

This revokes every outstanding session for that user, the same as changing a
password from inside the app, and grants no access you didn't already have —
it needs the same database credentials already in your `.env`.

## Next

- [Configuration reference](./configuration) — every environment variable,
  what it does, and why.
- [Upgrading](./upgrading) — what to expect between releases (pre-1.0 caveats
  apply).
