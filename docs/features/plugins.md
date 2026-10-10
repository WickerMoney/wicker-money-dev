---
sidebar_position: 8
description: Turning plugins on and off from Settings, who can do it, and what happens to a plugin's data.
---

# Plugins

Everything in Wicker Money that *interprets* money is a plugin: budgets, the
Until payday widget, the forecast, the charts, the CSV importer. **Settings →
Plugins** (`/settings#plugins`) is where you see them and choose which are on.

*Added in 0.4.0.*

## What the list shows

Every plugin on the instance, with:

- its name, version, and whether it's bundled with the app;
- what it adds: the pages and dashboard widgets that appear or disappear with
  it;
- whether it's **on**, **off**, or **failed to load**, with the reason. A
  plugin that's off but would fail to load says so too, before you turn it on.

The bundled plugins are:

| Plugin | Id | Adds |
|---|---|---|
| Budgets | `wickermoney.budgets` | The Budgets page, including [budget windows](./budget-windows) and [account allowances](./budget-account-allowances), and the Budget breakdown widget |
| CSV Import | `wickermoney.import-csv` | The Import page |
| Forecast | `wickermoney.forecast` | The [Forecast](./forecast) page |
| Insights | `wickermoney.insights` | The Money in and out and Where it went dashboard widgets |
| Spending Trends | `wickermoney.spending-trends` | The Spending trends dashboard widget |
| Upcoming | `wickermoney.upcoming` | The [Until payday](./until-payday) widget |

## Turning a plugin on or off

Only an **owner** can do this (see [Owners and members](./owners-and-members)).
The switch applies to the whole instance, for every account, not just yours.
A member sees the plugins that are on, read-only.

- **It applies at once.** The plugin's sidebar entry, pages and dashboard
  widgets appear or disappear without a page reload. Other open tabs catch up
  when they regain focus.
- **Turning a plugin off deletes nothing.** Its tables, rows and database role
  stay where they are, and turning it back on brings everything back. That's
  why there's no confirmation step.
- **Plugins in the same area can be on together**, such as two budgeting
  approaches.
- Opening a page from a plugin that's off shows "*Name* is turned off"
  instead of "Not found". An owner gets a **Manage plugins** link back to this
  list.

## How much a plugin is trusted

*Wording clarified in 0.5.0; behaviour unchanged.*

A plugin's pages and widgets run inside the app, in its own origin, with the
same access to your data as you have. The tables a manifest asks for
(`requiredTables`) are guarded by a per-plugin PostgreSQL role for a plugin's
server-side code, which only the bundled plugins have; they don't restrict its
front-end code at all. Even that server-side guard is there to catch honest
mistakes, not to stop crafted SQL, so it is a guardrail rather than a
sandbox. That is why installing third-party plugins isn't supported, and why
`PLUGIN_REMOTE_ORIGINS` should stay empty unless you trust every origin you
list.

## What isn't here yet

- Installing a plugin that isn't bundled. Third-party plugins need isolation
  that doesn't exist yet; today all plugin code runs fully trusted, in the app's own origin. See the
  [roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md).
- Per-account choices. A plugin is on or off for the whole instance.

For plugin authors, see
[Writing a plugin](../contributing/plugin-authoring#when-a-plugin-is-turned-off).
For the endpoints, see [API reference](../api/overview#plugins).
