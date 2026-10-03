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
  leaves the account on `UTC` rather than failing the sign-up.
- `GET /api/v1/auth/me` returns `{ id, email, timezone }`.
  `PATCH /api/v1/auth/me` with `{ "timezone": "America/New_York" }` changes the
  zone. It must be an IANA name, matched case-insensitively and stored
  canonically. Fixed offsets such as `+01:00` are refused with
  `400 validation_failed`. See [Time zone](../features/time-zone).

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
| `recurring` | Recurring items and their occurrences (`/api/v1/recurring-items`) |
| `onboarding` | First-run / starter setup |
| `settings` | Instance and account settings, data export |
| `plugins` | Plugin registry — what's installed, enabled |
| `core` | Read-only data routes for plugins (`/api/v1/core/...`), each behind a manifest grant |

Bundled plugins with a server half (budgets, import-csv) register their own
routes under the same plugin-host mechanism described in
[Architecture](../contributing/architecture) — they aren't core API surface,
and aren't listed here. The other bundled plugins (insights,
spending-trends, upcoming, forecast) have no server code and read through the
`core` routes below.

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
| `GET /api/v1/recurring-items/occurrences` | Every occurrence in the half-open range `[from, to)`. Defaults to today plus 31 days; at most 400 days |

An item's body is `{ name, kind, frequency, seriesStartDate, endDate?,
semimonthlyDays?, categoryId?, legs: [{ accountId, amount }] }`. `kind` is
`income`, `bill`, `debt_payment` or `transfer`; `frequency` is `once`, `daily`,
`weekly`, `biweekly`, `semimonthly`, `monthly`, `quarterly` or `annual`.
Amounts are signed money strings, never numbers. The service checks that the
legs fit the kind (a bill is one negative leg; a transfer or debt payment is two
legs netting to zero, and a debt payment's receiving account must be a card or
loan) and answers `400 validation_failed` naming the first rule broken.

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
`dailyBalances` and `flowTotals`.

## In the meantime

Reading the Zod schemas next to each route handler
(`apps/api/src/*/routes/schemas/`) is the most accurate source of truth right
now — they're also what would feed the generated OpenAPI spec once that's
wired up.
