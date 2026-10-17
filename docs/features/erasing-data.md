---
sidebar_position: 11
description: The two erase actions at the bottom of Settings — what "erase my data" and "erase this entire instance" delete and keep, what stops an instance erase, and how a new plugin's tables join the erase plan.
---

# Erasing your data

The bottom of **Settings** has two erase actions. They are separate sections,
with separate buttons, separate confirmation phrases and separate code paths on
purpose, so confirming one can't be mistaken for the other. Neither has an undo.

*Added in NEXT_VERSION.*

| | Erase my data | Erase this entire instance |
|---|---|---|
| Who can do it | Any signed-in account | An owner only |
| What it removes | Everything *you* own | Every account and everyone's data |
| Your login | **Kept** | Removed with all the others |
| Phrase to type | `erase my data` | `erase this instance` |
| Also asks for | Your password | The owner's password |

Both ask for the account password again, even though you're signed in, and a
wrong password is refused without deleting anything. The phrase is compared
without regard to case or surrounding spaces.

## Export first

Each confirmation offers **Download my data first**, the same file as
**Export all data** in Settings. In the instance erase, the download is **your own data
only**: other people on the instance would need to export their own before you
erase. The export is not required, and nothing is erased by downloading it.

## Erase my data

Deletes everything you own, in one step, and signs you out everywhere:

- **From the app:** your accounts, transactions and splits, categories and
  category rules, and recurring items with their occurrences, changes and
  dismissed match suggestions.
- **From every plugin:** the CSV import's batches and saved mappings, Budgets'
  lines and account allowances, and Debt payoff's debts and plan settings. A
  plugin that's switched off is included, because switching a plugin off keeps
  its data.
- **The setup wizard** is put back, so a fresh sign-in starts from an empty
  account.
- **All of your sessions** are ended, on every device, last.

What it **keeps**: the account itself. Your email, password, role and time zone
stay, so you can sign straight back in to an empty ledger. Other people's data
is untouched.

**Decision: it keeps your login.** Deleting the account as well is a different
action with consequences of its own (the email becomes free, the instance's last
owner could disappear), so it isn't folded in here, and there is no screen for
removing a login yet.

It runs as a single transaction: a failure part-way leaves everything as it was.
Running it again with nothing left deletes nothing and succeeds.

## Erase this entire instance

For an owner. It deletes every account and everyone's data, in every plugin, and
signs everyone out. Afterwards the instance is empty and **the first person to
register becomes its owner**, under the usual rules (see
[Owners and members](./owners-and-members#choosing-who-the-owner-is)).

The confirmation dialog first asks the server for the facts, and shows:

- the **database name**, so you can see which instance you're about to empty;
- how many **other sessions** are live and how many other people they belong
  to. If there are any, the button stays disabled until you tick that you
  understand they'll be signed out and their data deleted;
- a **blocker**, if there is one (below).

**What it keeps**, because it's the instance's configuration rather than anyone's
data: which plugins are switched on and their settings, the deployment records,
the key that signs the per-request tenant context (without it the API wouldn't
start), and the list of applied migrations. Schemas, roles and policies are
untouched, so there is nothing to migrate afterwards.

### Blockers on erasing an instance

Two settings stop the erase, because after it nobody could set up a first owner
and you'd be left with an instance you can't administer. The dialog explains
which, and the server refuses with a `409` carrying the same code:

| Blocker | When | What to do |
|---|---|---|
| `registration_disabled` | `REGISTRATION_ENABLED=false` | Set it to `true` and restart, erase, then close registration again |
| `bootstrap_owner_mismatch` | `BOOTSTRAP_OWNER_EMAIL` names an address other than the owner who is erasing | Erase while signed in as that account, or change the setting and restart |

A third refusal, `active_sessions`, applies while other sessions are live and
you haven't ticked the acknowledgement. If someone signs in between the check
and your confirmation, the dialog shows the new count and asks again.

### How it works

Row-level security shows an owner only their own rows, and the application's
database role may not `TRUNCATE`, so an instance erase can't be queries the API
sends. It is one database function (`core.erase_instance()`, added in migration
032) that re-checks the caller is an owner and truncates `core.users`, every
table in `core` with a `user_id` column, and every table in every `plugin_`
schema, in a single statement. It finds those tables in the database's own
catalog every time, so a table a later migration adds is covered without
touching the function. `TRUNCATE` is given no `CASCADE`: a table outside that
set that still references one inside it makes the statement fail and roll back,
rather than silently emptying more than expected.

## Limits

- **Requests already in flight.** An erase doesn't stop a request that was
  already running: a write that commits between the check and the deletion could
  leave a row behind for someone who has just been signed out. Access tokens are
  checked against their session on every request, so ending the sessions rejects
  them at once.
- **Both actions are rate limited** per account (`429` past the limit).
- If you need to be able to get back, take a database backup first
  (`pg_dump`, as on the [upgrade page](../self-hosting/upgrading#general-procedure)).
  The export file is a copy of your data, not a restore point.

## For contributors: adding a table to the erase plan

*Bundled plugins only; there is no hook in the plugin SDK for this.*

Erase my data doesn't discover tables, it follows a plan in
`apps/api/src/settings/service/ERASE_PLAN.ts`:

- A **core table** with a `user_id` column goes in `CORE_ERASE_ORDER`, with
  rows that point at a table listed before the table they point at.
- A **bundled plugin's tables** go in that plugin's entry in
  `PLUGIN_ERASE_PLANS`, children before the tables they reference. A new bundled
  plugin with its own schema needs a new entry. Each plugin's tables are emptied
  under that plugin's own database role, so its grants and row-level security
  apply exactly as they do for its routes. Plugin tables are emptied before the
  core tables, because plugin rows usually point at core rows with
  `ON DELETE RESTRICT`.
- The plan is checked, not trusted. Before deleting anything, the erase compares
  the plan with every table in the database that has a `user_id` column, in the
  same transaction. If one is missing, it answers `500 erase_unplanned_tables`,
  deletes nothing, and a test (`settings/eraseMyData.integration.test.ts`) fails
  in CI before that ever reaches a release.
- Add a row for the new table to `testing/eraseFixtures.ts` so the tests can
  prove the erase empties it.

The instance erase needs nothing from you: it reads the catalog itself.
