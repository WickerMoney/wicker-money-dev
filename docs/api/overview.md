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
| `settings` | Instance and account settings, data export |
| `plugins` | Plugin registry: the plugins the app loads, and the owner-only list and on/off switch |
| `core` | Read-only data routes for plugins (`/api/v1/core/...`), each behind a manifest grant |

Bundled plugins with a server half (budgets, import-csv) register their own
routes under `/api/v1/p/<pluginId>/`, using the plugin-host mechanism
described in [Architecture](../contributing/architecture). They aren't core
API surface; [Budgets](#budgets) below lists the routes that come up most.
While a plugin is turned off, its routes answer `404 plugin_disabled`. The
other bundled plugins (insights, spending-trends, upcoming, forecast) have no
server code and read through the `core` routes below.

## Plugins

Added in 0.4.0. See [Plugins](../features/plugins).

| Method and path | Who | What it does |
|---|---|---|
| `GET /api/v1/plugins` | Any signed-in user | The enabled plugins' manifests, each with a `bundled` flag, and `failures` for plugins that are on but didn't load. This is what the web app loads |
| `GET /api/v1/plugins/registry` | Owner | Every registered plugin, on or off: `id`, `name`, `description`, `author`, `version`, `bundled`, `enabled`, `status` (`enabled`, `disabled` or `failed`), `failure` (why it can't load, reported even while it's off, or `null`) and `contributes` (the titles of the pages and widgets it adds) |
| `PATCH /api/v1/plugins/:pluginId` | Owner | Body `{ "enabled": boolean }`. Idempotent. Returns `{ plugin, previous: { enabled }, changed, changedBy: { id, email }, changedAt }`, and logs each change at `info` |

A member calling either owner route gets `403 owner_required`. An unknown
`pluginId` is a `404`. Turning a plugin off deletes nothing. While it's off,
its own routes answer `404 plugin_disabled`, and a core data request carrying
its `x-wickermoney-plugin` header gets `403 grant_denied`.

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
| `GET /api/v1/recurring-items/:id/occurrences/:date/candidates` | For each unsettled leg, the transactions that could settle it, best first. Nothing is linked |
| `POST /api/v1/recurring-items/:id/occurrences/:date/matches` | `{ transactionId }`: the transaction settled one leg (and the other row of a transfer, when it's on the item's other leg). `409` with `already_matched`, `leg_matched` or `occurrence_skipped` |
| `DELETE /api/v1/recurring-items/:id/occurrences/:date/matches/:transactionId` | Unmatch. The transaction itself is unchanged |
| `POST /api/v1/recurring-items/:id/occurrences/:date/dismissals` | `{ transactionId }`: never suggest this pair again (a transfer's partner row too). Returns `{ itemId, nominalDate, transactionIds }`. `409 already_matched` if the transaction settles this occurrence |
| `DELETE /api/v1/recurring-items/:id/occurrences/:date/dismissals/:transactionId` | Undo a dismissal (`204`) |
| `GET /api/v1/recurring-items/suggestions` | For occurrences from two weeks ago to a few days ahead, the most likely transaction for each unsettled leg, plus the `dismissed` pairs in the same window |
| `GET /api/v1/recurring-items/transaction-matches?transactionIds=a,b,…` | For a page of transactions (1–200 ids), in one request: the occurrence each one settles, the occurrence suggested for it, and the occurrences it was dismissed for. Only transactions with something to show are listed |
| `GET /api/v1/recurring-items/transaction-matches/:transactionId` | The occurrences one transaction could settle, best first, for picking a different one than suggested |

Each candidate carries `dismissed`. Nothing is ever linked without a `POST
.../matches`.

### For plugins

The routes above are the app's own. A plugin reads recurring data through
`/api/v1/core` instead, where the server checks each request against the
tables the plugin's manifest declares in `requiredTables`:

| Path | Grants | Returns |
|---|---|---|
| `/core/recurring-items/list` | `recurring_items` | Active items with their legs and next due date |
| `/core/recurring-items/occurrences` | `recurring_items` | Occurrences in a range, as above |
| `/core/recurring-items/upcoming` | `recurring_items`, `accounts` | The [Until payday](../features/until-payday) view: window, per-account outlook, safe to spend, occurrences |
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
coerced.

| Method and path | What it does |
|---|---|
| `GET /month?month=YYYY-MM` | The month's lines, with spend derived from the ledger |
| `PUT /line` | Create or update a monthly line |
| `DELETE /line` | Remove a monthly line |
| `POST /month/adopt` | Start a month from the previous month's lines |
| `GET /at-risk` | The Budget breakdown widget's ranking |
| `PUT /window` | Create a [budget window](../features/budget-windows), or update one with `id`. Body `{ id?, categoryId, start, through, planned, note? }`; both dates are included. `409 overlaps` when the category already has a line on any of those days |
| `DELETE /window?id=` | Remove a window |

## In the meantime

Reading the Zod schemas next to each route handler
(`apps/api/src/*/routes/schemas/`) is the most accurate source of truth right
now — they're also what would feed the generated OpenAPI spec once that's
wired up.
