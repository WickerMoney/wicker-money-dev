---
sidebar_position: 1
description: Run your own Wicker Money instance with Docker, from pulling an image to your first login.
---

# Quickstart

Run your own Wicker Money instance with Docker. The sample compose file below
bundles PostgreSQL 16 for you — Wicker Money requires PostgreSQL specifically
(not SQLite or MySQL) because tenant isolation between plugins is enforced
with row-level security, roles and schemas that only PostgreSQL has. Already
running your own PostgreSQL 16+ server? Skip ahead to
[Using an existing PostgreSQL server](#using-an-existing-postgresql-server).

## 1. Get an image

```bash
docker pull ghcr.io/wickermoney/wicker-money:latest
```

:::tip[Pin a version once plugins are in the picture]
`:latest` is fine for a quick look. For anything you'll actually keep
running, pin a specific tag instead — for example
`ghcr.io/wickermoney/wicker-money:0.4.1` — and bump it deliberately. Bundled
plugins ship inside the same image, so an unpinned `:latest` can silently
change which plugin versions (and which `SDK_MAJOR_VERSION` they expect) you're
running on your next pull, instead of only when you choose to upgrade. See
[Upgrading](./upgrading) for how the app version and the plugin contract
version relate, and [Release tags](./release-tags) for what `:latest`, `:next`
and `:edge` each mean.
:::

## 2. Create the network and volumes

The sample compose file expects these to already exist, so a reverse proxy
(or anything else) can share the same network without editing the compose
file, and so `docker compose down --volumes` can't take your data with it by
accident:

```bash
docker network create wickermoney_default
docker volume create wickermoney_data
docker volume create wickermoney_pg_data
```

Skip `wickermoney_pg_data` if you're using an existing PostgreSQL server
instead of the bundled one — see below.

## 3. Configure

Copy [`docker/docker-compose.sample.yml`](https://github.com/wickermoney/wicker-money/blob/main/docker/docker-compose.sample.yml)
to `docker-compose.yml`. It's reproduced here as it is in the repository:

```yaml title="docker-compose.yml"
services:
  # Remove this whole block if you're bringing your own PostgreSQL 16+ server
  # (see "Using an existing PostgreSQL server" in the self-hosting docs), and
  # point DATABASE_URL / DATABASE_OWNER_URL below at it directly instead.
  # Customizing anything else about that server -- role names especially --
  # review .env.example top to bottom first: it documents every variable this
  # image reads, including ones (APP_DB_ROLE) that must be set identically on
  # both `migrate` and `wickermoney` below, or the two disagree at runtime on
  # what a plugin's own database role is called.
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=wickermoney
      - POSTGRES_USER=wickermoney
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}
    networks:
      - wickermoney_default
    volumes:
      - wickermoney_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U wickermoney -d wickermoney"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  # One-shot: creates/updates the schema, the wickermoney_app role, and every
  # bundled plugin's role, then exits. This container showing Exited (0) in
  # `docker compose ps` after `up` is expected — it isn't a long-running
  # process, and it is safe to re-run on every start.
  migrate:
    image: ghcr.io/wickermoney/wicker-money:latest
    command: ["node", "dist/db/cli.js", "up"]
    environment:
      # loadConfig() requires DATABASE_URL at every entry point, cli.ts
      # included, even though migrations connect with DATABASE_OWNER_URL only
      # -- this value is never actually used, just required to be present.
      #
      # These three assume the bundled wickermoney_app/wickermoney role names
      # from the postgres: service above. Using different role names (bring-
      # your-own Postgres)? Add APP_DB_ROLE here too, set to the exact same
      # value as in `wickermoney:` below -- see .env.example for what it does.
      - DATABASE_URL=postgresql://wickermoney_app:${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}@postgres:5432/wickermoney
      - DATABASE_OWNER_URL=postgresql://wickermoney:${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}@postgres:5432/wickermoney
      - APP_DB_PASSWORD=${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}
      - AUTH_SECRET=${AUTH_SECRET:?AUTH_SECRET is required}
    networks:
      - wickermoney_default
    depends_on:
      # Bundled Postgres only. Deleting the postgres: service above? Delete
      # this whole depends_on block too -- Compose refuses to start if
      # anything still depends on a service that no longer exists.
      postgres:
        condition: service_healthy
    restart: "no"

  wickermoney:
    # Pin a released version (for example :0.1.0) instead of :latest for repeatable deploys.
    image: ghcr.io/wickermoney/wicker-money:latest
    ports:
      - "${HOST_PORT:-8180}:8080"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - COOKIE_SECURE=${COOKIE_SECURE:-false}
      # Same role-name caveat as `migrate:` above: if you added APP_DB_ROLE
      # there, add it here too with the identical value.
      - DATABASE_URL=postgresql://wickermoney_app:${APP_DB_PASSWORD:?APP_DB_PASSWORD is required}@postgres:5432/wickermoney
      - AUTH_SECRET=${AUTH_SECRET:?AUTH_SECRET is required}
      - AUTH_ACCESS_TTL_SECONDS=${AUTH_ACCESS_TTL_SECONDS:-900}
      - AUTH_REFRESH_TTL_SECONDS=${AUTH_REFRESH_TTL_SECONDS:-2592000}
      - LOG_LEVEL=${LOG_LEVEL:-info}
    networks:
      - wickermoney_default
    volumes:
      - wickermoney_data:/app/data
    depends_on:
      # Bundled Postgres only -- remove just this "postgres:" key (keep
      # "migrate:" below) if you delete the postgres: service above.
      postgres:
        condition: service_healthy
      migrate:
        condition: service_completed_successfully
    restart: unless-stopped

networks:
  # Shared external network (reverse proxy etc.). Create it once:
  #   docker network create wickermoney_default
  wickermoney_default:
    external: true
    name: wickermoney_default

volumes:
  wickermoney_data:
    external: true
    # Create it once: docker volume create wickermoney_data
    name: wickermoney_data
  wickermoney_pg_data:
    external: true
    # Create it once: docker volume create wickermoney_pg_data
    # External (like wickermoney_data above) so `docker compose down --volumes`
    # can't take your actual financial data with it by accident.
    name: wickermoney_pg_data
```

and create a `.env` next to it:

```bash title=".env"
POSTGRES_PASSWORD=CHANGE_ME
APP_DB_PASSWORD=CHANGE_ME
AUTH_SECRET=
```

Generate `AUTH_SECRET` with `openssl rand -base64 48`. It signs access tokens
*and* derives the key that signs the per-request tenant context every
row-level security policy checks — treat it like a database credential, not a
cosmetic setting.

`POSTGRES_PASSWORD` and `APP_DB_PASSWORD` are two different roles on the
*same* database, deliberately. The `migrate` service connects as the
database owner (`wickermoney`, authenticated with `POSTGRES_PASSWORD`)
because creating schemas, policies and `SECURITY DEFINER` functions needs
privileges a superuser bypass makes possible — and the `wickermoney` app
service connects as `wickermoney_app` (authenticated with `APP_DB_PASSWORD`)
for exactly the opposite reason: a superuser bypasses row-level security
unconditionally, so if the long-running API had owner privileges, every
isolation policy would be decorative.

## 4. Start it

```bash
docker compose up -d
```

This brings the stack up in order: PostgreSQL starts and reports healthy,
then `migrate` applies schema migrations, creates the `wickermoney_app` role,
and provisions every bundled plugin's role, then exits — only once that
succeeds does the `wickermoney` app container start. If `migrate` fails, the
app container never starts rather than booting against a half-migrated
database.

By default the app listens on `http://localhost:8180` (override with
`HOST_PORT`). If you're putting a reverse proxy in front, add
`- TRUST_PROXY=true` to the `wickermoney` service's `environment:` list.
Without it, every request appears to come from the proxy's address, and the
per-address auth rate limits apply to everyone behind it collectively instead
of individually.

## 5. First login

Open the app and register. The first account on an instance is its
**owner**, the only kind of account that can turn plugins on and off; anyone
who registers after you is a **member** (see
[Owners and members](../features/owners-and-members)). Your account takes your
browser's time zone, which
decides when "today" turns over for recurring items, "Until payday" and the
forecast. Check it under **Settings → Time zone** if the browser's zone isn't
the one you live in. Once the accounts you need exist, close registration: add
`- REGISTRATION_ENABLED=false` to the `wickermoney` service's `environment:`
list and run `docker compose up -d` again. The compose file passes only the
variables it lists, so putting it in `.env` alone does nothing (see the
[Configuration reference](./configuration#auth)).

## Using an existing PostgreSQL server

Prefer to point at a PostgreSQL 16+ server you already run? Delete the
`postgres` service block from `docker-compose.yml` entirely (and skip
creating the `wickermoney_pg_data` volume above), then set `DATABASE_OWNER_URL`
and `DATABASE_URL` directly on the `migrate` and `wickermoney` services
instead of the computed `postgresql://...@postgres:5432/...` values — Compose
has no service named `postgres` left to build that connection string from
once the block is gone:

```bash title=".env"
DATABASE_URL=postgresql://wickermoney_app:CHANGE_ME@your-postgres-host:5432/wickermoney
DATABASE_OWNER_URL=postgresql://wickermoney:CHANGE_ME@your-postgres-host:5432/wickermoney
APP_DB_PASSWORD=CHANGE_ME
AUTH_SECRET=
```

Deleting the `postgres` service block also leaves two dangling
`depends_on: postgres` entries behind — one on `migrate`, one on
`wickermoney` — and Compose refuses to start with *"service ... depends on
undefined service postgres"* until both are removed. `migrate` ends up with
no `depends_on` at all (there's no local container left to wait on);
`wickermoney` keeps its `depends_on: migrate: condition:
service_completed_successfully` entry, just without the `postgres` one
alongside it.

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
