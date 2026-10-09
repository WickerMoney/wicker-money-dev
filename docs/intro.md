---
sidebar_position: 1
description: What Wicker Money is, how the core-plus-plugins model works, and where to go from here.
slug: /
---

# Introduction

Wicker Money is a self-hostable personal finance app, built as a thin core
plus installable plugins.

The core owns identity, money movement and the app shell. Everything that
*interprets* money — budgets, forecasting, FIRE planning,
importers — is a plugin built against `@wickermoney/plugin-sdk`. A fresh
install is useful on its own. Bundled plugins ship enabled, an owner can turn
any of them off from Settings without losing its data, and they are built
against the same SDK a third-party plugin would use. Plugin code is fully
trusted today, so installing third-party plugins isn't supported yet.

:::caution[Pre-1.0, single maintainer]
Wicker Money is pre-1.0 and has one maintainer (Jeremy). Some of what's on
this site describes where a piece of self-hosting is headed rather than a
polished, battle-tested path — that's called out explicitly wherever it
applies. See [the roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md)
for what's shipped versus planned.
:::

## Where to go next

- **[Self-hosting](/docs/self-hosting/quickstart)** — run your own instance
  with Docker.
- **[Features](/docs/features/recurring-items)** — recurring items and
  matching them to what landed, the "Until payday" widget, the balance
  forecast, budget windows and account allowances, turning plugins on and
  off, and owners and members.
- **[Contributing](/docs/contributing/dev-environment)** — set up a dev
  environment and understand how the codebase is laid out.
- **[API reference](/docs/api/overview)** — endpoint reference (in progress).

## License

The application (`apps/*`) and bundled plugins (`plugins/*`) are
[AGPL-3.0-only](https://github.com/wickermoney/wicker-money/blob/main/LICENSE).
`plugin-sdk` and `ui-kit` — the surface a plugin is built against — are
Apache-2.0, which is what makes an independently-built, non-bundled plugin
possible to license on its own terms. See
[the architecture overview](/docs/contributing/architecture#licensing-boundary)
for why that split exists.
