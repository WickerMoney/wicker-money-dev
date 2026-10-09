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
release whose migrations all have a `down` can go back by running
`node dist/db/cli.js down` once per migration, with the **new** image, then
starting the old one. Otherwise, the only way back is restoring the backup
from step 2. The version notes below say which kind each release is.

The running API never migrates on its own boot — it only ever holds the
low-privilege app role's credentials, which deliberately can't create schemas,
policies or roles. Migrations are always a separate, explicit step against the
owner role.

## Version notes

### 0.4.2 → 0.5.0

- **Back up first.** Two migrations, both reversible. One adds
  `plugin_budgets.account_lines` for
  [account allowances](../features/budget-account-allowances). The other
  replaces the `core.register_user` function and adds
  `core.instance_has_users()` for `BOOTSTRAP_OWNER_EMAIL`. Going back to 0.4.2
  is `node dist/db/cli.js down` twice with the 0.5.0 image, then starting the
  old image. That discards account allowances and restores the earlier
  registration function.
- **Name your owner before the first start** if the instance has no accounts
  yet and other people can reach it: set `BOOTSTRAP_OWNER_EMAIL` to your
  address (see [Owners and members](../features/owners-and-members#choosing-who-the-owner-is)).
  Unset, nothing changes: the first account to register is the owner. An
  existing instance keeps every account's role either way. In production the
  API now logs a warning at start-up when the instance has no accounts,
  registration is open and the variable is unset.
- **Account allowances.** The Budgets page gains an "Account allowances"
  section, and the Budgets plugin now asks for read access to accounts. An
  account with an allowance counts as in use, so deleting it asks for the
  usual confirmation.
- **A faster dashboard.** The three dashboard widgets that read the monthly
  summary now make one request. It is a browser-side change only; see
  [Reads are shared between widgets](../contributing/plugin-authoring#reads-are-shared-between-widgets).
- **Plugin trust wording.** The docs, `SECURITY.md` and `.env.example` now
  say plainly that plugin UI code runs fully trusted in the app's origin.
  Behaviour is unchanged. Keep `PLUGIN_REMOTE_ORIGINS` empty unless you fully
  trust every origin you list.
- **For API clients:** the Budgets and CSV Import routes refuse an id that
  PostgreSQL could not have generated (a version digit of 0, say) with the
  usual `400`. Ids from the app are unaffected. The Budgets routes gain
  `PUT /account-line` and `DELETE /account-line`, and the Budgets export
  gains `accountLines`.
- **For plugin authors:** `@wickermoney/plugin-sdk/server` is new and
  additive; nothing already published moved. See
  [Writing a plugin](../contributing/plugin-authoring#server-contract-wickermoneyplugin-sdkserver).

### 0.4.1 → 0.4.2

- **No migrations.** Upgrading is a pull and a restart, and going back to
  0.4.1 is safe: run the old image as it is.
- **Check for placeholder passwords first.** 0.4.2 refuses to start in
  production if `AUTH_SECRET` or the app database password still looks like a
  placeholder (`change-me`, `change_me`, `CHANGE_ME` or the other throwaway
  values listed under [Placeholder credentials](#placeholder-credentials)).
  If you generated real values, as the quickstart says to, nothing changes.
  If not, fix it before you pull: it takes two minutes, and the section below
  has the steps.
- **Phones and narrow windows.** The sidebar becomes a drawer, and Transactions,
  Accounts, Recurring and Categories show as cards. Categories and Rules are
  collapsible, and row actions are icon buttons.
- **Accessibility.** Each page has its own tab title, there is a "Skip to
  content" link, and the light-mode warning colour is darker.
- **Matching.** The Transactions page finds recurring-item matches for the
  newest transactions on a long ledger, where it could miss them before.
- **For API clients:** nothing changed.

### 0.4.0 → 0.4.1

- **No migrations.** Upgrading is a pull and a restart, and going back to
  0.4.0 is safe: run the old image as it is.
- **Add the new starter categories.** 0.4.1 adds **Memberships** (under
  Subscriptions, for store and shopping memberships such as Costco or
  Amazon Prime) and **Domains / web hosting** (under Technology). They
  aren't added to accounts that are already set up. Open **Categories →
  Run setup again** and finish the wizard: it adds only what's missing and
  leaves every category you already have as it is, renames included.
- **Domains / web hosting needs the tech answer.** It's created when the
  setup question about smart home, networking, gaming or web hosting is
  ticked (the wording now mentions hosting). Memberships is in everyone's
  base set.
- **For API clients:** nothing changed. The catalog is two entries larger.

### 0.3.0 → 0.4.0

- **Back up first.** Two migrations, both reversible:
  - **025** adds the table that remembers dismissed match suggestions, and a
    unique `(user_id, id)` key on `core.transactions`. Building that index
    blocks writes (not reads) to transactions for as long as one index build
    takes.
  - **026** makes only the first account an owner from now on.
- **Going back to 0.3.0:** run `node dist/db/cli.js down` twice with the
  0.4.0 image, then start the 0.3.0 image. That discards dismissed
  suggestions, and puts back the old default that makes every new account an
  owner.
- **Existing accounts keep their role.** Before 0.4.0, every account was
  registered as an owner, and 026 doesn't change existing rows. If several
  people signed up on your instance, they are all still owners, and any of
  them can turn plugins on and off. To check, and to demote with SQL, see
  [Owners and members](../features/owners-and-members).
- **For API clients:** `validation_failed` messages are reworded, so a client
  that matches on message text needs updating. Read `code` and the new
  `issues` list instead (see [API reference](../api/overview#errors)).
  `GET /api/v1/transactions?uncategorized=true` no longer returns linked
  transfer legs.
- **Building from source** needs Node 22.22.2+ or 24.15+. The container image
  is unaffected.
- New: Settings → [Plugins](../features/plugins), matching from the
  Transactions page and dismissing a suggestion (see
  [Matching](../features/matching)), and form errors shown on the field
  they're about.

### 0.2.1 → 0.3.0

- **Back up first. This upgrade can't be rolled back without that backup.**
  - **023** (budget windows) adds the `btree_gist` extension and a constraint
    so a category can't have two budget lines on the same day. It's
    reversible: its `down` deletes any windows and drops the constraint, which
    leaves monthly lines exactly as 0.2.1 had them. `btree_gist` is a trusted
    extension, so the non-superuser database owner can create it.
  - **024** (recurring occurrences) adds the tables behind matching, skips,
    moves and per-occurrence amounts, and a nullable
    `core.transactions.recurring_occurrence_id`. It has **no `down`**:
    dropping it would discard every match and override. Going back to 0.2.1
    means restoring the backup.
- **PostgreSQL 15 or later** is required by 024, because its foreign key
  uses `ON DELETE SET NULL (column)`. 16 was already the documented minimum,
  so a supported install is unaffected.
- **For API clients:** budgets refuses a planned amount with more than four
  decimal places (`400`) instead of quietly truncating it. Recurring
  occurrence views gain `nominalDate`, `expectedDate` and `status`; `date` is
  where the list places an occurrence, which for a late one is the first
  projected day.
- New: [Matching](../features/matching) for recurring items, and
  [budget windows](../features/budget-windows).

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

## Placeholder credentials

From 0.4.2, with `NODE_ENV=production` (the container image's default), the API
and the `migrate` step refuse to start when `AUTH_SECRET` or `DATABASE_URL`
contains a placeholder or throwaway value: `change-me`, `change_me`,
`changeme`, `testpw` or `_dev_password`, in any case (so the quickstart's old
`CHANGE_ME` counts). A placeholder is publicly known: with a known
`AUTH_SECRET` anyone can forge a sign-in. The check never prints the value, and
no data is touched when it refuses.

You'll see this in `docker compose logs migrate` (or `wickermoney`):

```text
Invalid configuration:
  AUTH_SECRET contain a development credential. Refusing to start with NODE_ENV=production.
```

### Are you affected?

Only if you left a placeholder in place. In the folder with your `.env`:

```bash
grep -i -E "change[-_]?me|testpw|_dev_password" .env
```

No output means you are fine. `POSTGRES_PASSWORD` (the owner password) is not
checked, so a hit there alone doesn't stop anything; see
[rotating the owner password](#rotating-the-owner-password) if you want to
change it anyway.

### Fix it (Docker Compose)

1. **Pick new values** and put them in `.env`:

   ```bash
   openssl rand -base64 48   # AUTH_SECRET
   openssl rand -hex 24      # APP_DB_PASSWORD
   ```

   Use `-hex` for the database password: it is placed inside a connection URL,
   and `+`, `/` and `=` from base64 would break it. You only need to replace the
   ones that were placeholders.

2. **Start the stack.** `migrate` runs first, every time:

   ```bash
   docker compose pull
   docker compose up -d
   ```

   It reinstalls the tenant key from the new `AUTH_SECRET` and sets the app
   database role's password to the new `APP_DB_PASSWORD`. Look for these two
   lines in `docker compose logs migrate`:

   ```text
   Tenant context key installed from AUTH_SECRET.
   Role 'wickermoney_app' configured: LOGIN granted, password set.
   ```

3. **Sign in again** if you changed `AUTH_SECRET`: every session is signed out.
   Nothing else is lost. Changing only `APP_DB_PASSWORD` signs nobody out.

If you pulled 0.4.2 first and it stopped, nothing is damaged: edit `.env` and
run `docker compose up -d` again.

### Fix it (without the sample compose)

Set `AUTH_SECRET`, and the same new password in `DATABASE_URL` and
`APP_DB_PASSWORD`, then run migrations with the owner credentials before
starting the app, as in the [general procedure](#general-procedure):

```bash
docker run --rm --env-file .env wickermoney node dist/db/cli.js up
```

### Rotating the owner password

`POSTGRES_PASSWORD` only sets the owner password when the database is first
created, so editing `.env` later changes nothing in the database. To rotate it,
change the role first, then `.env`:

```bash
docker compose exec -it postgres psql -U wickermoney -d wickermoney
# then, at the psql prompt:
\password wickermoney
```

Set the same value as `POSTGRES_PASSWORD` in `.env` afterwards, so `migrate`
can still connect.

## After changing `AUTH_SECRET`

Re-run migrations. `AUTH_SECRET` derives the key that signs the tenant context
every row-level security policy checks; the API refuses to start if the
database's installed key doesn't match the configured secret. Rotating it
also invalidates every existing session — expected, not a bug.
