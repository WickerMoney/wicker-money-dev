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

Responses over 1 KiB are compressed (brotli or gzip, per `Accept-Encoding`),
with `Content-Encoding` and `Vary: Accept-Encoding` set; a client that doesn't
ask for compression gets the plain body. *Added in 0.6.0.* Behind a
reverse proxy, don't compress a second time (see
[Compression: don't compress twice](../self-hosting/configuration#compression-dont-compress-twice)).

## Authentication

- Access tokens are short-lived (15 minutes by default) and sent by the
  client.
- The refresh token is an HttpOnly, `SameSite=Strict` cookie scoped to
  `/api/v1/auth`, rotated on every use. Presenting an already-used refresh
  token revokes the whole session as suspected theft.
- `POST /api/v1/auth/register` can be disabled per-instance
  (`REGISTRATION_ENABLED=false`) once your accounts exist. It takes an
  optional `timezone` (the web app sends the browser's). An unrecognised zone
  leaves the account on `UTC` rather than failing the sign-up. The first
  account registered on an instance becomes its owner and later ones are
  members (see [Owners and members](../features/owners-and-members)).
- `GET /api/v1/auth/me` returns `{ id, email, timezone, role }`, where `role`
  is `owner` or `member`. The user returned by register, login and refresh
  carries `role` too. The role isn't a token claim: the server reads it on
  every owner-only request, so a change applies on the next request.
  `PATCH /api/v1/auth/me` with `{ "timezone": "America/New_York" }` changes the
  zone. It must be an IANA name, matched case-insensitively and stored
  canonically. Fixed offsets such as `+01:00` are refused with
  `400 validation_failed`. See [Time zone](../features/time-zone).

## Errors

An error response is `{ code, message }`, plus `issues` on a validation
error. `code` is the stable part to branch on; `message` is a sentence for a
person and can change between releases (0.4.0 reworded many of them).

- `400 validation_failed` always carries `issues: { path, message }[]`, and
  the list is never empty. `path` is where in the request the problem is, as
  an array of keys and indexes (`["legs", 0, "amount"]`). An empty `path`
  means the request as a whole. When the request body fails its schema, the
  top-level `message` joins every issue as `path: message`, separated by `; `,
  as it did before `issues` existed.
- `401` without a valid session, `403 owner_required` when a member calls an
  owner-only route, `404` for something that doesn't exist or isn't yours,
  and `409` for a conflict, with a `code` naming it.
- `429 rate_limited` when a user (or, for a request with no valid token, a
  client address) is over the API rate limit, with a `Retry-After` header in
  seconds. *Added in NEXT_VERSION, on by default.* The limits and the way to
  raise or switch them off are on [API rate limit](../self-hosting/configuration#api-rate-limit).
  The sign-in routes and the password-confirmed actions also answer `429`, with
  their own counters.
- `503 import_busy` from a CSV import commit that waited too long for its turn
  (see [Import CSV](#import-csv)), with a `Retry-After` header.
- A bundled plugin's own routes may return `issues` in the same shape.
  `@wickermoney/ui-kit` reads them for you (see
  [Writing a plugin](../contributing/plugin-authoring#form-errors)).

## Dates and "today"

Calendar dates are `YYYY-MM-DD` strings. Anything that depends on the current
date (next due dates, occurrence windows, the forecast) is computed on the
server against the user's **today**: their calendar day in
`core.users.timezone`. The response includes it as `today`, so a client never
needs the browser clock to agree.

## Feature areas

Route groups that exist today, by source directory
(`apps/api/src/<area>/routes`) — endpoint-level detail is what the generated
reference above will cover:

| Area | Covers |
|---|---|
| `auth` | Register, login, logout, refresh, change password, current user (read, and set its time zone) |
| `accounts` | Accounts, balances, buffer and *safe to spend*, initial balance, usage, archive, and deleting an account with its history or moving that history (transactions and recurring items) to another account |
| `transactions` | Transactions, splits, transfers (with an optional `externalId` for duplicate-safe imports) |
| `categories` | Categories, category rules, rule preview |
| `recurring` | Recurring items, their occurrences, and matching transactions to them (`/api/v1/recurring-items`) |
| `onboarding` | First-run / starter setup |
| `users` | Owner-only account administration: listing accounts and changing a role (`/api/v1/users`) |
| `settings` | Instance and account settings, data export, and the two erase actions |
| `plugins` | Plugin registry: the plugins the app loads, and the owner-only list and on/off switch |
| `core` | Read-only data routes for plugins (`/api/v1/core/...`), each behind a manifest grant |

Bundled plugins with a server half (budgets, import-csv, debt-payoff) register their own
routes under `/api/v1/p/<pluginId>/`, using the plugin-host mechanism
described in [Architecture](../contributing/architecture). They aren't core
API surface; [Budgets](#budgets), [Debt payoff](#debt-payoff) and
[Import CSV](#import-csv) below list the routes that come up most.
While a plugin is turned off, its routes answer `404 plugin_disabled`. The
other bundled plugins (insights, spending-trends, upcoming, forecast) have no
server code and read through the `core` routes below.

## Accounts

`GET /api/v1/accounts` lists the signed-in user's accounts by name. Archived
accounts are left out unless `?includeArchived=true`.

*`fields` added in 0.6.0.* `?fields=basic` returns only `id`, `name`,
`accountType`, `currencyCode`, `spendable` and `archivedAt`: no balance,
opening balance or buffer. It also skips the work the full list does to
compute balances, which sums every transaction of every account, so use it to
fill a picker (the Transactions page's account filters do). Leave `fields` out,
or send `fields=full`, for the unchanged full list. Any other value is a
`400 validation_failed`.

## Plugins

Added in 0.4.0. See [Plugins](../features/plugins).

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/v1/plugins` | Any signed-in user | The enabled plugins' manifests, each with a `bundled` flag, and `failures` for plugins that are on but didn't load. This is what the web app loads |
| `GET /api/v1/plugins/registry` | Owner | Every registered plugin, on or off: `id`, `name`, `description`, `author`, `version`, `bundled`, `enabled`, `status` (`enabled`, `disabled` or `failed`), `failure` (why it can't load, reported even while it's off, or `null`) `contributes` (the titles of the pages and widgets it adds), and, *added in 0.6.1*, `origin` (the origin its remote entry loads from, or `null` for this instance's own origin or when there is no usable manifest) and `tables` (the core tables its manifest lists, sorted; empty when there is no usable manifest). The two new fields are additive: nothing else in the response changed |
| `PATCH /api/v1/plugins/:pluginId` | Owner | Body `{ "enabled": boolean }`. Idempotent. Returns `{ plugin, previous: { enabled }, changed, changedBy: { id, email }, changedAt }`, and logs each change at `info` |
| `POST /api/v1/plugins/:pluginId/token` | Signed-in user (their own access token) | *Added in 0.6.0.* Mints a five-minute token that speaks for one plugin, for the app to hold on a sandboxed plugin's behalf. Returns `{ token, expiresAt, pluginId, grants }`. `404 not_found` for an id nobody registered, `404 plugin_disabled` for a plugin that is off or whose manifest doesn't load. A plugin token can't mint another |

A member calling either owner route gets `403 owner_required`. An unknown
`pluginId` is a `404`. Turning a plugin off deletes nothing. While it's off,
its own routes answer `404 plugin_disabled`, and a core data request carrying
its `x-wickermoney-plugin` header gets `403 grant_denied`.

### Plugin tokens

*Added in 0.6.0.* The web app holds a plugin token for each plugin that runs in a sandboxed frame; plugins in the app's own page don't use one. A plugin token carries the user
(`sub`), the session it was minted under, the plugin id and the tables the
plugin's manifest grants, with its own audience so it never verifies as an
ordinary access token. It lives five minutes, and one older than fifteen is
refused whatever it says. Logging out or changing the password ends it with
the session. A plugin token can reach only:

- the `GET /api/v1/core/*` reads its plugin was granted, and
- the plugin's own routes under `/api/v1/p/<its id>/`.

Everything else answers `403 plugin_route_denied` before its handler runs:
sign-in and refresh, `/settings/*` including the export, `/plugins/*`,
`/users/*`, the app's own accounts, categories, transactions and recurring
routes, and other plugins' routes. A plugin token has no owner powers, even
when the user is an owner. A route nobody classified is denied.

**Nothing in the web app mints or sends a plugin token yet**, so this does not
change what a UI plugin running in the app's page can reach; see
[How much a plugin is trusted](../features/plugins#how-much-a-plugin-is-trusted).

## Users and roles

*Added in 0.6.0.* Both routes are owner only; a member gets
`403 owner_required`. This is what Settings → People calls (see
[Owners and members](../features/owners-and-members#changing-someones-role)).

| Method and path | What it does |
|---|---|
| `GET /api/v1/users` | Every account on the instance, oldest first: `{ users: [{ id, email, role, createdAt }] }`. Nothing else about an account is returned: no password digest, no time zone, none of its data |
| `PATCH /api/v1/users/:id/role` | Body `{ "role": "owner" \| "member" }`. Returns `{ user, previous: { role }, changed, changedBy: { id, email }, changedAt }`. Idempotent: asking for the role the account already has reports `changed: false` and writes nothing |

The rules:

- Promoting a member makes a second owner. Registration never does that; this
  route is the only way.
- Demoting the only owner is refused with `409 last_owner`, whoever asks. An
  owner may name their own account, and may step down while another owner
  exists.
- If two owners demote each other at the same moment, one succeeds and the
  other gets `403 owner_required` (it was demoted while it waited) or
  `409 last_owner`.
- The change applies to that account's next request, and its sessions are left
  alone. Each change is logged at `info`.
- `400` for a bad id or body, `404` for an unknown account.

## Settings: export and erase

| Method and path | Who | What it does |
|---|---|---|
| `POST /api/v1/settings/export-ticket` | Any signed-in user | *Added in 0.6.0.* Body `{ "password": "..." }`. Checks the account password again and returns `{ ticket, expiresAt }`. The ticket works for one download, for two minutes, for that user in that session. A wrong password is `403 password_incorrect` (not `401`, so a client doesn't read it as an expired session), counted against the same attempt limit as the erase routes (`429` past it). Refused for a plugin token |
| `GET /api/v1/settings/export` | Any signed-in user, **with a ticket** | Everything the caller owns as one JSON document, `{ exportedAt, core, plugins }`, served as `wickermoney-export-<date>.json`. Send the ticket in the `x-wickermoney-export-ticket` header. Without one it is `403 export_confirmation_required`; with an unknown, expired, used or someone else's, `403 export_ticket_invalid`. A consistent snapshot, streamed as it is read. A failure after the first byte aborts the connection and leaves an unparseable file rather than a plausible one. Runs under `DB_LONG_STATEMENT_TIMEOUT` |
| `POST /api/v1/settings/erase-my-data` | Any signed-in user | Deletes everything the caller owns and ends all their sessions. The account itself stays |
| `GET /api/v1/settings/erase-instance` | Owner | The facts shown before an instance erase: `databaseName`, `registrationEnabled`, `bootstrapOwnerEmail`, `otherSessions`, `otherUsers` and a `blocker` (or `null`). Changes nothing |
| `POST /api/v1/settings/erase-instance` | Owner | Deletes every account and everything in every plugin schema, and signs everyone out |

*The erase routes were added in 0.6.0.* What each erase removes, and
what it keeps, is on [Erasing your data](../features/erasing-data).

Both erase routes take `{ "password", "confirmation" }`, the account password
again and the typed phrase (`erase my data` or `erase this instance`, compared
without regard to case or surrounding spaces); the instance erase also takes
`"acknowledgeActiveSessions": true` to go ahead while other sessions are live.
Both answer `204` and clear the refresh cookie, so the client is signed out.
Nothing is deleted unless the response is `204`.

| Status and code | Meaning |
|---|---|
| `400 validation_failed` | The phrase is wrong (issue on `confirmation`) or the password is missing |
| `403 password_incorrect` | The password is wrong. It's a `403`, not a `401`, so a client that treats `401` as an expired session doesn't sign the person out over a typo |
| `403 owner_required` | A member called an owner-only route |
| `409 active_sessions` | Other sessions are live and `acknowledgeActiveSessions` wasn't `true` |
| `409 registration_disabled`, `409 bootstrap_owner_mismatch` | The erased instance could not get a first owner again; see [the blockers](../features/erasing-data#blockers-on-erasing-an-instance) |
| `429` | Past the per-user attempt limit |
| `500 erase_unplanned_tables` | Erase my data only: the database holds a table with user data that the erase plan doesn't name. Nothing was deleted. The instance erase reads the tables from the database itself and doesn't have this check |

## Recurring items

Added in 0.2.0 (the forecast in 0.2.1). See
[Recurring items](../features/recurring-items) for the model: an item is a
schedule plus one signed **leg** per account.

| Method and path | What it does |
|---|---|
| `GET /api/v1/recurring-items` | List items. `?includeEnded=true` adds ended series; `?accountId=` keeps items with a leg on that account |
| `POST /api/v1/recurring-items` | Create an item |
| `GET /api/v1/recurring-items/:id` | One item |
| `PUT /api/v1/recurring-items/:id` | Rewrite the whole item, legs included |
| `POST /api/v1/recurring-items/:id/end` | End the series on `endDate` (default: the user's today) and keep it |
| `DELETE /api/v1/recurring-items/:id` | Delete the item and its legs (`204`) |
| `GET /api/v1/recurring-items/occurrences` | Every occurrence in the half-open range `[from, to)`. Defaults to today plus 31 days; at most 400 days. `?itemId=` keeps one item's |

An item's body is `{ name, kind, frequency, seriesStartDate, endDate?,
semimonthlyDays?, categoryId?, legs: [{ accountId, amount }] }`. `kind` is
`income`, `bill`, `debt_payment` or `transfer`; `frequency` is `once`, `daily`,
`weekly`, `biweekly`, `semimonthly`, `monthly`, `quarterly` or `annual`.
Amounts are signed money strings, never numbers. The service checks that the
legs fit the kind (a bill is one negative leg; a transfer or debt payment is two
legs netting to zero, and a debt payment's receiving account must be a card or
loan) and answers `400 validation_failed`, with an issue on the field it's
about (`legs.0.amount` for one leg's amount, `toAccountId` or `amount` for a
transfer).

Since 0.3.0, items carry `tracked` and `late`, and `nextDue` passes over
skipped and already-paid occurrences. Each occurrence in a list carries
`nominalDate` (its scheduled date, which with the item id identifies it),
`expectedDate` (where it was moved to, if it was), `status`, and for each leg
the transaction that settled it. `date` is where a list places the
occurrence, which for a late one in a projection is the first projected day.
`status` is one of `upcoming`, `due`, `late`, `missed`, `cleared`, `skipped`
or `assumed` (see [Matching](../features/matching#late-and-missed)).

### Matching and occurrences

Added in 0.3.0; dismissals and the `transaction-matches` routes in 0.4.0. See
[Matching](../features/matching). `:date` is the occurrence's nominal date,
`YYYY-MM-DD`.

| Method and path | What it does |
|---|---|
| `GET /api/v1/recurring-items/:id/occurrences/:date` | One occurrence and where it stands. `404` if the schedule has no occurrence on that date |
| `PUT /api/v1/recurring-items/:id/occurrences/:date` | How this occurrence differs from the series: `{ skipped?, expectedDate?, legs? }`, each replacing what was recorded. An empty body puts it back to the series. `expectedDate` is at most 31 days from the nominal date; `legs` (`[{ accountId, amount }]`) must fit the item, and a transfer must still net to zero. `409 occurrence_matched` when skipping one a transaction settles |
| `GET /api/v1/recurring-items/:id/occurrences/:date/candidates` | For each unsettled leg, the transactions that could settle it, best first, and `truncated` (see below). Nothing is linked |
| `POST /api/v1/recurring-items/:id/occurrences/:date/matches` | `{ transactionId }`: the transaction settled one leg (and the other row of a transfer, when it's on the item's other leg). `409` with `already_matched`, `leg_matched` or `occurrence_skipped` |
| `DELETE /api/v1/recurring-items/:id/occurrences/:date/matches/:transactionId` | Unmatch. The transaction itself is unchanged |
| `POST /api/v1/recurring-items/:id/occurrences/:date/dismissals` | `{ transactionId }`: never suggest this pair again (a transfer's partner row too). Returns `{ itemId, nominalDate, transactionIds }`. `409 already_matched` if the transaction settles this occurrence |
| `DELETE /api/v1/recurring-items/:id/occurrences/:date/dismissals/:transactionId` | Undo a dismissal (`204`) |
| `GET /api/v1/recurring-items/suggestions` | For occurrences from two weeks ago to a few days ahead, the most likely transaction for each unsettled leg, plus the `dismissed` pairs in the same window, and `truncated` (see below) |
| `GET /api/v1/recurring-items/transaction-matches?transactionIds=a,b,…` | For a page of transactions (1–200 ids), in one request: the occurrence each one settles, the occurrence suggested for it, and the occurrences it was dismissed for. Only transactions with something to show are listed |
| `GET /api/v1/recurring-items/transaction-matches/:transactionId` | The occurrences one transaction could settle, best first, for picking a different one than suggested |

Each candidate carries `dismissed`. Nothing is ever linked without a `POST
.../matches`.

**`truncated`** *(added in 0.6.0)*. Candidates for matching come from an
account's newest 500 transactions in the date range that aren't already linked
to an occurrence. A very busy account could drop the oldest of them with no sign
that it had. The candidates response now carries `truncated` on each leg, and
the suggestions response carries a top-level `truncated`; either is `true` when
a query hit the cap and a match that needs one of the oldest rows may be
missing. It's additive, and the app doesn't show it yet.

### For plugins

The routes above are the app's own. A plugin reads recurring data through
`/api/v1/core` instead, where the server checks each request against the
tables the plugin's manifest declares in `requiredTables`:

| Path | Grants | Returns |
|---|---|---|
| `/core/recurring-items/list` | `recurring_items` | Active items with their legs and next due date |
| `/core/recurring-items/occurrences` | `recurring_items` | Occurrences in a range, as above |
| `/core/recurring-items/upcoming` | `recurring_items`, `accounts` | The [Until payday](../features/until-payday) view: window, per-account outlook, safe to spend, occurrences. Since 0.6.0 every leg of an occurrence also carries `accountName`, archived accounts included, so a client can name the other side of a transfer without asking for the account list |
| `/core/recurring-items/forecast?accountId&horizon` | `recurring_items`, `accounts` | The [Forecast](../features/forecast) view for one account |

A `recurring_items` grant also covers `recurring_item_legs`. A missing grant
answers `403`.

The forecast's `horizon` is `30d`, `60d`, `90d` (default), `6m` or `eoy`.
Without `accountId`, it picks the first spendable checking account (then any
checking account, then any spendable account, then the first by name); an
`accountId` that isn't one of the user's active accounts answers `404`. The
response is `{ today, horizon, window, accounts, account, days, stats,
entries, hasItems }`. `days` has one entry per projected day with the end
balance and the day's `low` (outflows before inflows). `stats` holds start,
end, lowest, days below zero and below the buffer, and the first breach of
each. The zero and buffer fields are `null` for cards and loans.

The other `core` routes (`/core/accounts/list`, `/core/accounts/summary`,
`/core/categories/list`, `/core/transactions/monthly-summary`) follow the same
pattern with the `accounts`, `categories` and `transactions` grants.

The date maths behind all of this is public in
`@wickermoney/plugin-sdk/recurrence` (zod-free, safe in the browser):
`occurrences`, `nextOccurrence`, `nextPayday`, `monthlyEquivalent`,
`dailyBalances` and `flowTotals`. Since 0.3.0, `RecurringItem.overrides`
(keyed by nominal date: `skipped`, `date`, `legs`) is honoured by
`dailyBalances`, `flowTotals` and `nextPayday`, and `scheduledOccurrences` and
`nextScheduledOccurrence` give the schedule with overrides applied.

## Budgets

The budgets plugin's routes, under `/api/v1/p/wickermoney.budgets`. Amounts
are decimal strings with at most four decimal places. Since 0.3.0 a fifth
decimal place is refused with `400 bad_planned` instead of being truncated,
the same as the rest of the API, and a JSON number is refused rather than
coerced. Since 0.5.0, an id sent to these routes must be one PostgreSQL
could have generated (the canonical hyphenated form with a valid version and
variant); anything else gets the usual `400` instead of reaching the database.
The same rule applies to the CSV Import routes. Ids from the app are
unaffected.

| Method and path | What it does |
|---|---|
| `GET /month?month=YYYY-MM` | The month's lines, with spend derived from the ledger |
| `PUT /line` | Create or update a monthly line |
| `DELETE /line` | Remove a monthly line |
| `POST /month/adopt` | Start a month from the previous month's lines |
| `GET /at-risk` | The Budget breakdown widget's ranking |
| `PUT /window` | Create a [budget window](../features/budget-windows), or update one with `id`. Body `{ id?, categoryId, start, through, planned, note? }`; both dates are included. `409 overlaps` when the category already has a line on any of those days |
| `DELETE /window?id=` | Remove a window |
| `PUT /account-line` | Create or update an [account allowance](../features/budget-account-allowances). Body `{ month, accountId, planned, rollover?, excludedCategoryIds?, note? }`; `rollover` defaults to true. `400 bad_account` unless the account is a checking account of yours, `400 bad_excluded` for a category that isn't yours |
| `DELETE /account-line?month=&accountId=` | Remove an account allowance for one month |

## Debt payoff

The debt payoff plugin's routes, under `/api/v1/p/wickermoney.debt-payoff`.
*Added in 0.6.0; per-debt fields added in NEXT_VERSION.* See
[Debt payoff](../features/debt-payoff) for what the plan assumes. Amounts and rates are strings, never JSON numbers: a balance is
at most four decimal places, and an `apr` is a percentage, so `"24.99"` is
24.99%. Unknown fields in a body are refused rather than ignored.

| Method and path | What it does |
|---|---|
| `GET /debts` | The person's debts, in their own order. `?includeArchived=true` adds archived ones |
| `POST /debts` | Create a debt: `{ name, balance, apr, minimumPayment, accountId?, sortOrder?, archived?, included?, extraPayment?, repaymentStartsOn?, promoApr?, promoEndsOn?, promoDeferredInterest?, promoInterestBase?, compounding? }`. The last seven are described below |
| `GET /debts/:id` | One debt |
| `PUT /debts/:id` | Change a debt. Send any of the create fields (at least one); a field not sent keeps its value, and `accountId: null` removes the link |
| `DELETE /debts/:id` | Remove a debt. Answers `{ removed: 1 }` |
| `GET /settings` | The saved `{ strategy, extraPayment, saved }`. Until the person saves a choice you get `avalanche`, `0` and `saved: false` |
| `PUT /settings` | `{ strategy?, extraPayment? }`, either or both |
| `GET /plan?strategy&extra&tz` | The payoff plan. A parameter left out comes from the saved settings, and `tz` (an IANA zone, deciding what today is) defaults to `UTC`. Asking for a different strategy doesn't change the saved one |
| `GET /account-suggestions` | `{ accounts }`: the person's loan and credit card accounts that aren't archived, each with the `debtId` already tracking it or `null` |

*Added in NEXT_VERSION.* A debt has these further fields. Each is optional on
create and on update, and leaving all of them out gives the plan a debt had
before they existed:

| Field | Meaning |
|---|---|
| `included` | Boolean, default `true`. `false` keeps the debt in the list but leaves it out of the plan, its totals and the debt-free date. Archived debts are never in the plan |
| `extraPayment` | A monthly amount, default `"0.0000"` and never negative. Paid to this debt after the minimums and before the shared extra is spread, and not added to the shared pool, so it stops when the debt is paid off |
| `repaymentStartsOn` | `YYYY-MM-DD` or `null`. Until the first plan month whose payment date is on or after it, no minimum is due and interest keeps adding to the balance |
| `promoApr`, `promoEndsOn` | A promotional rate (a percentage string, `"0"` allowed) and its last day; both or neither, or `400 bad_promotion` |
| `promoDeferredInterest` | Boolean, default `false`. Needs a promotional rate, or `400 bad_promotion` |
| `promoInterestBase` | `original` (default) or `declining`: what backdated interest is charged on when a deferred-interest promotion is not cleared in time |
| `compounding` | `monthly` (default), `daily` or `daily_simple` |

`PUT /settings` and its strategy and extra are unchanged. The plan response is
additive: besides the fields below it carries `earmarked` (the sum of the debts'
own extra amounts, for debts that start with a balance), `excludedDebts` (`{ id, name }` for
each debt switched out of the plan, archived ones not listed), and on each
debt in `debts` its `extraPayment`, `repaymentStartsOn`, `repaymentStartMonth`,
`compounding`, `earmarkCoversBalance` and a `promo` object (or `null`). A debt
list item carries every field in the table. The data export gained the same
columns.

The plan carries the month-by-month `schedule`, each debt's payoff date, the
`totalInterest` and `totalPaid`, `debtFreeDate` (or `null`), `months`, and the
comparison with paying only the minimums (`minimumsOnly`, `monthsSaved`,
`interestSaved`). A plan that doesn't finish within `monthLimit` (600) reports
`capped: true` with a `cappedReason` and no debt-free date.

Errors: `400` (`validation_failed`, `bad_id`, `bad_body`, `bad_promotion` for a
promotional rate without an end date or the reverse, or deferred interest
without a rate, and `bad_account` for an
account that isn't one of the person's own loan or credit card accounts),
`404 not_found` (including a debt that belongs to someone else), and `409`:
`account_already_linked` (another active debt already tracks that account) or
`too_many_debts` (at most 50 debts that aren't archived). Each debt is the
person's own: the table is under row-level security.

## Import CSV

The CSV import plugin's routes, under `/api/v1/p/wickermoney.import-csv`.
A request carries the account, the column mapping and the CSV text. The CSV
can be at most 8,000,000 bytes (`400` above that), and a file with more data
rows than `IMPORT_MAX_ROWS` (default 100,000, counting rows that can't be
read) is refused with `400 too_many_rows` before anything is written. See
[Pool, statement timeouts and the import limit](../self-hosting/configuration#pool-statement-timeouts-and-the-import-limit).
Both routes run under the longer `DB_LONG_STATEMENT_TIMEOUT`.

*Added in NEXT_VERSION.* A process commits at most `IMPORT_MAX_CONCURRENT` imports
at once. A `commit` over that limit waits for its turn and, after
`IMPORT_QUEUE_WAIT_SECONDS`, is refused with `503 import_busy`, a message that
says nothing was imported, and a `Retry-After` header in seconds. Send the same
request again after that, with the same `idempotencyKey`, and it imports once.
Both routes also count against the API's import rate limit
(`API_RATE_LIMIT_IMPORT_MAX`, 30 a minute per user by default), which answers
`429 rate_limited`. See [Concurrent imports](../self-hosting/configuration#concurrent-imports).

| Method and path | What it does |
|---|---|
| `POST /analyze` | Reads and classifies a file without writing anything |
| `POST /commit` | Writes the import as one batch. Rows classified `new` are imported, `needs-review` rows only when their row number is in `acceptRowNumbers`, duplicates never. An optional `idempotencyKey` (1 to 128 characters) makes a repeat return the first outcome with `replayed: true` |
| `GET /batches` | The 25 most recent batches |
| `POST /batches/:id/revert` | Undo one import |

### The `analyze` response

:::caution[Changed in 0.6.0: `analyze` no longer returns every row]
Before 0.6.0, `analyze` answered with the verdict for every row of the
file, which for an 8 MB file was a 21 MB response. A client that read every row
from it, rather than showing the counts and the rows to review, now sees only
the first page. Read `flagged` for the rows that need a decision, and use
`summary` for the counts. `commit` classifies the file itself, so rows you were
never shown are still handled exactly as the person decided.
:::

`analyze` responds `200` with `{ summary, errors, rows, flagged }`:

- `summary`: counts for the whole file: `total`, `new`, `duplicate`,
  `needsReview` and `errors`.
- `errors`: at most 50 row errors. `summary.errors` has the full count.
- `rows`: the first 100 rows of the file with their verdicts, in file order. It
  is a preview, not every row.
- `flagged`: `{ total, offset, rows }`, a page of the rows with status
  `needs-review`, in file order. `total` is every flagged row in the file
  (equal to `summary.needsReview`).

To read another page of flagged rows, send the same request with
`flaggedOffset` (a whole number from 0, default 0) and `flaggedLimit` (a whole
number from 1, default 500, **lowered to 1000** if larger). Each such request
sends the file again and analyses it again. A value that isn't a whole number
is a `400`.

## In the meantime

Reading the Zod schemas next to each route handler
(`apps/api/src/*/routes/schemas/`) is the most accurate source of truth right
now — they're also what would feed the generated OpenAPI spec once that's
wired up.
