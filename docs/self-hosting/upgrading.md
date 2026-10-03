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

1. **Read the release's entry in the
   [changelog](https://github.com/wickermoney/wicker-money/blob/main/CHANGELOG.md)**,
   and the version notes below.
2. **Back up your database.** Migrations run forward-only in practice, and some
   have no `down` at all, so the way back to an older image is restoring this
   backup:
   ```bash
   pg_dump -Fc -d "$DATABASE_OWNER_URL" -f wickermoney-$(date +%F).dump
   ```
3. Pull or build the new image tag.
4. Run migrations against the new image, using the **owner** credentials
   (`DATABASE_OWNER_URL`), before starting the new container:
   ```bash
   docker run --rm --env-file .env wickermoney node dist/db/cli.js up
   ```
5. Start the new container.

With the [quickstart's compose file](./quickstart#3-configure), steps 3–5 are
`docker compose pull` then `docker compose up -d`: its `migrate` service runs
before the app starts, every time.

A release with no migrations can go back to the previous image as it is. A
release with migrations can only go back by restoring the backup from step 2.

The running API never migrates on its own boot — it only ever holds the
low-privilege app role's credentials, which deliberately can't create schemas,
policies or roles. Migrations are always a separate, explicit step against the
owner role.

## Version notes

### 0.2.0 → 0.2.1

- **No migrations.** Upgrading is a pull and a restart, and going back to
  0.2.0 is safe.
- **Set your time zone.** Accounts created before 0.2.1 are still on `UTC`,
  so "today" for recurring items and "Until payday" turns over in the evening
  anywhere west of UTC. After upgrading, open **Settings → Time zone**; it
  offers your browser's zone in one click. Accounts registered from 0.2.1 on
  take the browser's zone at sign-up.
- New: the Forecast page (bundled plugin `wickermoney.forecast`). See
  [Forecast](../features/forecast).

### 0.1.0 → 0.2.0

- **Back up first. This upgrade can't be rolled back without that backup.**
  Migration 021 reshapes `core.recurring_items` into an item plus per-account
  legs (`core.recurring_item_legs`) and adds a `once` value to the recurrence
  enum. PostgreSQL can't remove an enum value, so 021 has no `down`.
- Migration 021 copies every existing recurring item's account, amount and
  transfer target into legs before dropping those columns. A row it can't
  represent fails the migration and names its id rather than being dropped.
  The backfill runs in its own transaction, so a failure leaves your recurring
  items as they were. Fix the row and run migrations again; 021 is safe to
  re-run.
- Migration 022 adds `core.accounts.spendable` and marks existing checking
  accounts spendable, so the "safe to spend" number starts from the same
  accounts it would have used anyway.
- Any plugin that read `account_id`, `amount`, `transfer_account_id` or
  `is_income` from `core.recurring_items` directly breaks. Bundled plugins are
  already updated.
- Known limitation (fixed in 0.2.1): there is no time zone setting yet, so
  "today" follows UTC.

## Two version numbers, not one

The app version (the Docker tag, e.g. `0.2.1`) and the plugin API's own
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
