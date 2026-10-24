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
| Debt Payoff | `wickermoney.debt-payoff` | The [Debt payoff](./debt-payoff) page and the Debt-free date dashboard widget |
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
  why turning one off doesn't ask.
- **Turning on a third-party plugin asks first.** *Added in 0.6.1.* For a
  plugin that isn't bundled, Settings → Plugins shows a confirmation before the
  switch goes on. It names the origin the plugin loads from and the tables it is
  granted, and repeats that it runs in a sandboxed frame, has no server-side code
  and can send what it reads to another server through the [known
  gaps](#how-much-a-plugin-is-trusted). Cancel leaves it off. Bundled plugins
  don't ask. The question is in the Settings page only: a request sent straight
  to the API doesn't ask.
- **Plugins in the same area can be on together**, such as two budgeting
  approaches.
- Opening a page from a plugin that's off shows "*Name* is turned off"
  instead of "Not found". An owner gets a **Manage plugins** link back to this
  list.

## How much a plugin is trusted

*Rewritten in 0.6.0, which adds the sandboxed runtime. The sandbox is new
code, and its broker and token path have not been through an independent
security review.*

Where a plugin's pages and widgets run depends on the plugin:

| Plugin | Where its UI runs | Trust |
| --- | --- | --- |
| Insights, Spending Trends | A sandboxed frame | Confined to its grants (below) |
| Budgets, Import CSV, Upcoming, Forecast, Debt payoff | **The app's own page** | **Fully trusted, not sandboxed** |
| A third-party plugin an operator has added | A sandboxed frame, always | Confined to its grants (below) |

**The five bundled plugins in the app's own page** share the page, its memory
and your session with the app. They can call any `/api/v1/*` route you can. The
tables a manifest asks for (`requiredTables`) and the `x-wickermoney-plugin`
header are developer feedback, not a security boundary for that code. They ship
in the image and are reviewed with the rest of the application.

**A plugin in a sandboxed frame** runs in an `<iframe sandbox="allow-scripts">`
whose document has its own content security policy. It has no access to the
app's cookies, storage or page, and script in the frame cannot make network
requests of its own (`fetch`, XHR, WebSocket and beacons are blocked). Its only
way to your data is a message channel to the app, which checks each request
against the plugin's grants and forwards it with a plugin-specific token that
lasts five minutes. The server gives that token a few read-only aggregate
routes for the tables the manifest lists, plus the plugin's own routes, and
refuses everything else, including sign-in, the data export, the erase actions,
plugin management and other plugins' routes. A hostile-plugin test suite
attempts about 140 escapes, in Chromium, on every pull request.

**What the sandbox does not stop** (observed in Chromium 141; WebKitGTK 2.52
was checked for the last item only; Firefox and Safari have not been tested):

- `<link rel=prerender>` and WebRTC (STUN and TURN) are not governed by the
  frame's content security policy. A hostile plugin can use them to reach an
  address it chooses and carry what it holds in the URL or the TURN username.
- A sandboxed frame can navigate itself to a URL on the app's own origin that
  the page's frame policy allows. In Chromium 141 that request carried none of
  your credentials and returned nothing to the plugin. In WebKitGTK 2.52 the same
  navigation carried a `SameSite=Strict` cookie. Don't assume either result for
  another browser.

The 0.6.1 release recorded a test of the obvious fixes: in Chromium 141, no
`Permissions-Policy` header, iframe `allow` value, cross-origin policy header or
CSP directive that browser implements closes prerender or WebRTC, so both stay
open.

A malicious plugin can therefore cause some requests and read nothing back, and
**a plugin granted your transactions can send them to another server through
these gaps.** They are known limitations, documented in the project's
[security policy](https://github.com/wickermoney/wicker-money/blob/main/SECURITY.md).

**Server-side plugin code stays first-party.** A plugin's own endpoints,
scheduled work and exporters run in the API process and are refused for any
plugin not in the image. For the bundled plugins, a per-plugin PostgreSQL role
limits which tables a query can touch. That role is a **guardrail, not a
sandbox**: the plugin query runner reads SQL text, so a crafted statement (a
`DO` block that builds `RESET ROLE` at run time, for instance) can return to the
application role and lose the manifest's table limits. Row-level security still
holds: such a statement reads no other person's rows. It catches honest
mistakes, not hostile code.

### Adding a third-party plugin (experimental)

There is no install flow, catalog or signing. The isolated runtime and loading
a third-party plugin are opt-in and off by default. The only way to add one is
for the operator to do it by hand:

1. Put the plugin's build on an https origin and list that origin in
   `PLUGIN_REMOTE_ORIGINS` (empty by default; with it empty, nothing changes).
2. Copy its manifest, with an `integrity` map of Subresource Integrity values
   for every file of the build, into the directory named by
   `PLUGIN_MANIFEST_DIR`, and restart the API.
3. Switch the plugin on as an owner in Settings → Plugins. It starts off, and
   from 0.6.1 the app asks you to confirm first (see [Turning a plugin on
   or off](#turning-a-plugin-on-or-off)).

A third-party plugin gets no server-side code, no storage and no scheduled work,
and can read only the read-only aggregates for the tables its manifest lists.
The pin makes the browser refuse a file whose bytes differ from the ones you
pinned; it covers only the files it lists, not stylesheets, and is only as good
as where you took the hashes from (take them from the build you reviewed, not
from the server that will serve it). It does not tell you the code is safe.
Treat a third-party plugin as code you chose to run inside a cage that has known
gaps. If you wouldn't give it the aggregates it asks for, don't add it. A
manifest that declares `endpoints` or `exporters`, a permission the host doesn't
implement (`network:outbound`, `schedule:daily`, `notify`), an origin that isn't
in `PLUGIN_REMOTE_ORIGINS`, or no pin is refused, and the reason is listed with
the plugin.

## What isn't here yet

- An install flow, a catalog or signing for third-party plugins. Today an
  operator adds one by hand (see above), and an independent security review
  comes first. Moving the five remaining bundled plugins into frames is also not
  done. See the
  [roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md).
- Per-account choices. A plugin is on or off for the whole instance.

For plugin authors, see
[Writing a plugin](../contributing/plugin-authoring#when-a-plugin-is-turned-off).
For the endpoints, see [API reference](../api/overview#plugins).
