---
sidebar_position: 3
description: What to expect when moving between releases while the project is pre-1.0.
---

# Upgrading

:::caution[Pre-1.0]
There is no upgrade-compatibility promise yet. Pre-1.0, a minor version can
include a breaking database migration or a config change without a major
version bump. Treat every upgrade like the first one: read the release notes,
back up first.
:::

## General procedure

1. **Back up your database.** Migrations run forward-only; there's no
   automatic rollback if one fails partway.
2. Pull or build the new image tag.
3. Run migrations against the new image, using the **owner** credentials
   (`DATABASE_OWNER_URL`), before starting the new container:
   ```bash
   docker run --rm --env-file .env wickermoney node dist/db/cli.js up
   ```
4. Start the new container.

The running API never migrates on its own boot — it only ever holds the
low-privilege app role's credentials, which deliberately can't create schemas,
policies or roles. Migrations are always a separate, explicit step against the
owner role.

## Two version numbers, not one

The app version (the Docker tag, e.g. `0.1.0`) and the plugin API's own
contract version (`SDK_MAJOR_VERSION`) move independently. A plugin built
against `plugin-sdk` cares about the latter, not the former — see
[Architecture](../contributing/architecture) for why the plugin contract is
versioned separately from the app itself. `SDK_MAJOR_VERSION` is not frozen
yet ([roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md)
item, targeted ahead of 1.0), so a bundled plugin can still change shape
between app releases.

## After changing `AUTH_SECRET`

Re-run migrations. `AUTH_SECRET` derives the key that signs the tenant context
every row-level security policy checks; the API refuses to start if the
database's installed key doesn't match the configured secret. Rotating it
also invalidates every existing session — expected, not a bug.
