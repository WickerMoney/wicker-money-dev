---
sidebar_position: 5
description: Rules for plugin code that the manifest schema doesn't tell you, money arithmetic with the SDK, the server contract, shared reads, what happens when a plugin is turned off, and showing form errors.
---

# Writing a plugin

A plugin is a Module Federation remote plus a manifest, built against
`@wickermoney/plugin-sdk` and `@wickermoney/ui-kit` (both Apache-2.0). The
build setup, and the rules that fail at runtime rather than at build time (the
remote must be an ES module, CSS must be injected with `adoptPluginStyles`,
paths are relative to the API root), are in the
[Writing a plugin](https://github.com/wickermoney/wicker-money/blob/main/DEVELOPMENT.md#writing-a-plugin)
section of the app repo's `DEVELOPMENT.md`. This page covers what changed for plugin code from 0.3.0 to 0.5.0.

## Stability tiers

*Added in 0.5.0.*

Every `@wickermoney/plugin-sdk` entry point has a tier, listed in the package
README and tagged `@stable` or `@experimental` in its module documentation.

| Import | Tier |
|---|---|
| `@wickermoney/plugin-sdk` (manifest, dashboard range) | stable |
| `@wickermoney/plugin-sdk/runtime` | stable |
| `@wickermoney/plugin-sdk/money` | stable |
| `@wickermoney/plugin-sdk/server` | stable |
| `@wickermoney/plugin-sdk/recurrence` | experimental |

- **Stable.** A breaking change (a removed or renamed export, a changed
  signature, type, return value or error) comes with a `BREAKING CHANGE`
  commit footer, an entry under **Breaking** in the changelog and a migration
  note. Additions are not breaking.
- **Experimental.** May change in any pre-1.0 minor release, including
  removals and reshaped types. Changes are still recorded in the changelog,
  but no migration note is promised, so re-check it on each upgrade.
- An export keeps the tier of the entry point it comes from, however it is
  imported: `occurrences` is experimental even when imported from the root.
- Until `SDK_MAJOR_VERSION` is frozen at 1, the whole contract can still move
  between minor releases. The tiers say how much notice to expect and which
  parts are settled.

No `./recurrence` export was removed in 0.5.0.

### Calendar helpers: `addDays` and `addMonths`

Also new in 0.5.0, exported from `@wickermoney/plugin-sdk/recurrence` and the
package root, in place of the copies the app and Budgets each carried:

- `addDays(date, days)` and `addMonths(date, months)` work on `YYYY-MM-DD`
  strings with no time zone involved, and accept negative values.
- `addMonths` clamps to the last day of a shorter month, so Aug 31 plus 6
  months is Feb 28 (Feb 29 in a leap year). Each call clamps on its own, so add
  the total to the original date rather than stepping a month at a time.
- Anything that isn't a real calendar date or a whole number throws
  `RangeError`. An impossible date such as `2026-02-30` no longer rolls over
  to March 2. If you wrote your own helper with that rollover, check what you
  pass to the SDK's.

## Money: `@wickermoney/plugin-sdk/money`

Money is `numeric(19,4)` in the database and a decimal string in TypeScript,
never a `number`. Since 0.3.0 the SDK has one module for exact arithmetic on
those strings, at `@wickermoney/plugin-sdk/money` (also exported from the
package root). Use it instead of keeping your own helpers. The bundled
budgets, insights and spending-trends plugins and the recurrence module all
do.

```ts
import { addMoney, compareMoney, equalMoney, sumMoney } from '@wickermoney/plugin-sdk/money'

sumMoney(['0.1', '0.2'])              // '0.3000', not 0.30000000000000004
equalMoney('-81.2000', '-81.20')      // true; `===` would say false
rows.sort((a, b) => compareMoney(a.total, b.total))
```

For loops over many values, work in `bigint` units of 0.0001 and format once:

```ts
import { moneyToUnits, unitsToMoney, divideUnits } from '@wickermoney/plugin-sdk/money'

let total = 0n
for (const row of rows) total += moneyToUnits(row.amount)
unitsToMoney(divideUnits(total * 26n, 12n))   // scale, then round once
```

The rules:

- **Strict input.** A plain decimal string with at most four decimal places.
  Anything else, a fifth decimal place included, throws `RangeError`. Nothing
  is silently truncated, and the API refuses the same input.
- **Canonical output.** Four decimal places, never `'-0.0000'`.
- **One rounding rule.** Only `divideUnits` rounds, half away from zero. That's
  the API's rule too, so a plugin and the server agree to the unit.
- **Not for display.** Show amounts with the host's `ctx.formatMoney`, and
  prefill inputs with `editableMoney` (`'450.0000'` → `'450.00'`).

The string helpers are `addMoney`, `subtractMoney`, `sumMoney`, `negateMoney`,
`absMoney`, `compareMoney`, `equalMoney`, `isNegativeMoney`, `isZeroMoney`,
`normalizeMoney`, `editableMoney` and `ZERO_MONEY`; the `bigint` layer is
`moneyToUnits`, `unitsToMoney`, `divideUnits`, `MONEY_UNIT` and
`MONEY_SCALE`; the type is `Money`.

## Server contract: `@wickermoney/plugin-sdk/server`

*Added in 0.5.0.*

A bundled plugin's server code exports a `register` function that the API
calls with a route context. The types for that, which each plugin used to
copy, now live in one subpath:

```ts
import { PluginRouteError, isUuid } from '@wickermoney/plugin-sdk/server'
import type { RouteContext, RegisterRoute, Query, RunAsPlugin } from '@wickermoney/plugin-sdk/server'
```

- `RouteContext`, `RegisterRoute`, `RouteMethod`, `Query` and `RunAsPlugin`
  describe what `register` is handed. `RuleForMatching`,
  `ConditionForMatching` and `RuleSubject` are the category-rule shapes the
  host injects.
- `PluginRouteError(message, statusCode, code, issues?)` refuses a request the
  person can fix. Throw it, or a subclass, and the API answers with that
  status and code.
- `isUuid` is the one id rule: the canonical hyphenated form in either case
  with an RFC 9562 version (1 to 8) and variant, plus the nil and max UUIDs.
  It is the rule the API applies to `:id` params, and every id PostgreSQL
  generates passes.

The subpath has no dependencies (no Zod) and is also re-exported from the
package root. It is additive: nothing already published moved. Budgets and
CSV Import, whose packages are private, dropped their own copies, so there is
nothing for an outside author to migrate. Server-side plugin code is for
bundled plugins only while third-party install is unsupported.

## Reads are shared between widgets

*Added in 0.5.0.*

`ctx.api.get` doesn't always reach the network. Plugins are separate bundles
that can't share module state, so the host's scoped client keeps a small
in-memory record of reads, per user. Identical `GET`s in flight join one
request, and a resolved one is reused for 5 seconds (50 entries per user,
least recently used out first). The three dashboard widgets that read the
same monthly summary make one request, with no plugin changes.

- The key is the signed-in user plus the full URL, so nothing is shared
  between users, and two plugins allowed to read the same table share the
  answer.
- Any write through the client drops that user's whole cache, so a read after
  a write is fresh. Sign-out and a change of user clear it too.
- Failures aren't kept: everyone waiting gets the error, and the next call
  asks again.
- Each caller gets its own copy of the response, so changing it affects
  nobody else.
- To force a fresh read, pass `{ cache: 'no-store' }` (or `'reload'`).

A plugin that was just turned off can still be answered from memory for up
to five seconds. This is a performance feature only: no API change, and no
server-side cache.

## When a plugin is turned off

Since 0.4.0 an owner can turn any plugin off from Settings → Plugins, and
back on, while the app is open (see [Plugins](../features/plugins)). When
yours is turned off:

- The host unmounts its pages and widgets. A remote that's already loaded
  stays in memory but is no longer rendered.
- Its own server routes answer `404 plugin_disabled`.
- A core data request carrying its `x-wickermoney-plugin` header gets
  `403 grant_denied`.
- Its schema, rows and database role are kept. Turning it back on restores
  everything.

So don't assume your code runs at every page load, don't depend on a widget
having mounted since sign-in, and never delete data on unmount.

## Form errors

Since 0.4.0, every `400 validation_failed` from the API carries
`issues: { path, message }[]` (see [API reference](../api/overview#errors)).
A bundled plugin's server can attach `issues` in the same shape to its own
errors, and the host passes them through.

`@wickermoney/ui-kit` turns them into errors on the right fields:

- `useFormErrors()` holds a form's errors. After `show(errors)`, focus moves
  to the first control marked invalid, or to the `FormError` when no field is.
- `formErrorsFrom(error, fields, fallback)` maps each issue to one of your
  field names (a list of dotted paths, or a function from a dotted path to a
  field name) and returns everything else as one form-level message. An error
  with no issues becomes a form-level message, its own or `fallback`.
- `FormError` shows the form-level message. Put it beside the submit button,
  where the person is looking when the form refuses.
- `validationIssuesOf(error)` reads the issues on their own. `NO_FORM_ERRORS`
  and `hasFormErrors` cover the empty case.
- `Field` and `SelectField` take an `error` (wired to `aria-invalid` and
  `aria-describedby`) and, since 0.4.0, an optional `hint`.

```tsx
// `api` is the plugin's scoped client from the SDK.
import { Field, FormError, Button, formErrorsFrom, useFormErrors } from '@wickermoney/ui-kit'

const { errors, ref, show, clearField } = useFormErrors()

async function save() {
  try {
    await api.put('/p/your.plugin.id/thing', { name, amount })
  } catch (e) {
    show(formErrorsFrom(e, ['name', 'amount'], 'Could not save that.'))
  }
}

return (
  <form ref={ref} onSubmit={(e) => { e.preventDefault(); void save() }}>
    <Field label="Name" value={name} error={errors.fields.name}
           onChange={(e) => { setName(e.target.value); clearField('name') }} />
    <Field label="Amount" value={amount} error={errors.fields.amount}
           hint="Up to four decimal places" onChange={(e) => setAmount(e.target.value)} />
    <Button type="submit">Save</Button>
    <FormError message={errors.form} />
  </form>
)
```

Check what you can in the browser first, with the same rules the API uses, so
most mistakes never make a round trip. The server still checks everything.
