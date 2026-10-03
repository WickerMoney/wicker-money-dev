---
sidebar_position: 3
description: The Forecast page, which projects one account's daily balance from its recurring items.
---

# Forecast

**Forecast** (in the sidebar, after Recurring) answers *where is this account
heading?* It projects one account's balance day by day from its recurring
items, starting from today's actual balance. It comes from the bundled plugin
`wickermoney.forecast` (`plugins/forecast`), which is read-only, holds the
`recurring_items` and `accounts` grants, and has no server code of its own. It
reads core's forecast endpoint through the plugin SDK client.

*Added in 0.2.1.*

## Choosing what to look at

- **Account**: any active account. The page opens on your first checking
  account that counts toward safe to spend, then any checking account, then
  any account that counts toward safe to spend, then the first account by name.
- **How far ahead**: 30 days, 60 days, 90 days (the default), 6 months, or end
  of year. Day counts start tomorrow, so 30 days covers 30 projected days. End
  of year on December 31 means the whole of next year rather than an empty
  chart.

## Reading the chart

- **It's a step chart.** A balance jumps when money moves and is flat in
  between, so a smooth line would invent balances that never existed.
- **Each day's outflows are drawn before its inflows**, like
  [Until payday](./until-payday). A bill due on payday shows as a dip on that
  day.
- **Zero** is a solid line and the account's **buffer** a dashed one. Time
  below zero is shaded.
- Hover, or focus the chart and use the arrow keys (Page Up and Page Down jump
  a week), for each day's end balance and low point.

For checking and savings, a banner above the chart gives the bad news first:
the day the balance first drops below the buffer (only when that comes before
it goes below zero), the day it first goes below zero, and the lowest point if
that falls on a later day. If the account is already below either today, it
says so. If the account stays clear, there's no banner.

The stat tiles show the balance **now**, at the **end** of the horizon, the
**lowest** point and its date, **days below zero**, and **days below the
buffer**. Days are counted from each day's low, not its closing balance.

## What moves the line

The table under the chart lists every occurrence with a leg on this account,
in date order, with the amount this account sees. Transfers are shown in a
neutral colour with their direction ("to Savings", "from Checking"), because
they move money between your accounts rather than spend it. A split paycheck
names its other accounts ("also to Savings").

## Cards and loans

A credit card or loan gets the chart and the table, but no banner, no zero or
buffer lines, and no below-zero counts. A negative balance there is just what you
owe.

## What it doesn't do

The forecast covers **recurring items only**. Everyday purchases that aren't
recurring items aren't in the line, and the page says so. It also doesn't yet
know whether an expected item has already been paid. That's the paid/landed
matching on the
[roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md).

For the endpoint, see
[API reference](../api/overview#recurring-items).
