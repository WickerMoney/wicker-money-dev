---
sidebar_position: 5.5
description: Monthly budgets, one planned amount per category per calendar month, with rollover, a pace marker and a draft of next month.
---

# Monthly budgets

The **Budgets** page (in the sidebar, from the bundled plugin
`wickermoney.budgets`) plans one amount per category **per calendar month** and
shows how much of it you have spent. This page covers those monthly lines. A
date range that isn't a month is a [budget window](./budget-windows), and money
set aside to spend from one checking account is an
[account allowance](./budget-account-allowances). Both sit on the same page.

*Added in 0.1.0.*

## One row per category per month

A budget isn't a template that you keep editing. Each month has its own row for
each category, so the plan you made for October is still there, unchanged, when
you look at it in March.

Only the **plan** is stored. Everything else on the page is worked out from your
ledger every time the page loads:

- **Spent** is the money that left the category that month. A refund filed in the
  category reduces it, and a split transaction (the API can make one; the web app
  has no split editor) counts part by part, each part in its own category.
- **Carried in** (see [Rollover](#rollover)) is replayed from earlier months.
- **Left** is planned plus carried in, minus spent.

Because of that, the Budgets page and the Transactions page can't disagree, and a
receipt you import late against an old month corrects every month after it.

## What counts as spending

The spent figure is deliberately narrow. These are **not** counted:

- **Transfers.** Both rows of a [transfer](./transfers) are left out, however
  they were categorized.
- **Categories that count as Income or Transfer** (see
  [Categories and rules](./categories-and-rules#what-a-category-counts-as)). A
  category like that can't be given a line either: it isn't offered in the
  picker, because its line would always read zero.
- **Uncategorized transactions.** Spending that has no category isn't attributed
  to anything, so it appears in no line and not in **Spent with no budget** either.
  File it with a [rule](./categories-and-rules#rules) or from the Transactions
  page and it shows up.

## Reading the page

Use **Previous**, **Next** and **This month** to move between months. The page
opens on the current month in your [time zone](./time-zone). The four figures at
the top total the month's category lines and windows:

| Figure | Meaning |
|---|---|
| **Planned** | The sum of the plans (a window counts in its first month only) |
| **Available** | Planned plus what rolled in |
| **Spent** | Spent across those lines |
| **Remaining** | Available minus spent. Negative means over overall |

[Account allowances](./budget-account-allowances) are kept out of these totals,
because the same spending is also counted in its categories.

Under **Lines**, each row shows:

| Column | What it is |
|---|---|
| **Category** | The category, with "carried in" or "overdrawn" and an amount underneath when a rolling line brought something in |
| **Planned** | An editable amount |
| **Spent** | Spent in the month |
| **Left** | Available minus spent |
| **Pace** | A bar of spent against available, with a mark for today |
| **Status** | A coloured dot and a word (below) |
| **Rolls over** | A checkbox |

### Pace and status

A bar at 80% is fine on the 28th and a problem on the 10th, so the bar carries a
mark showing how far through the month today is. A past month is judged on its
final total, so it reads **Over**, **Nothing spent** or **On track**, and a future
month reads the same way, since none of it has elapsed.

The **Status** is worked out from three things, checked in this order:

| Status | When |
|---|---|
| **Over** | Left is below zero |
| **Nothing spent** | Nothing has been spent in the category yet |
| **Ahead of pace** | Spent as a share of available is at least 1.15 times the share of the month that has passed |
| **Under pace** | Spent is under three quarters of the share of the month that has passed |
| **On track** | Everything else |

The pace is deliberately naive: spending is lumpy, and rent paid on the 1st makes
housing look "ahead of pace" all month. The status is a prompt to look, not a
verdict.

## Setting a plan

- **Add a line.** Pick a category under **Add a category** and press **Add
  line**. It starts at 0 with rollover off. The picker lists enabled categories
  that count as spending, grouped under their parents, and leaves out any that
  already have a line that month.
- **Change the plan.** Type in the **Planned** field. It saves when you leave
  the field, and Enter leaves it. Amounts can't be empty (enter 0 for no plan) or
  negative, and have at most four decimal places. The reason shows under the
  field if one is refused.
- **Remove a line.** **Remove** deletes that month's line for that category, and
  no other month's.

A category can't have two lines on the same day. If a [window](./budget-windows)
covers part of the month for that category, saving a monthly line for it is
refused with a message that says so.

## Rollover

**Rolls over** is a checkbox on each line, not a setting for the whole budget,
because half of anyone's categories want it and half don't.

- **Off** (the default for a new line): a monthly allowance. It starts fresh
  every month and passes nothing on. Groceries is the usual example.
- **On**: a sinking fund. What is left at the end of the month is added to the
  next month's available amount, and **overspending is carried too**, as a
  negative. A car-maintenance fund you overdrew has less in it next month.
  Ticking the box saves straight away, along with any plan you had typed.

The carried amount is never stored. It is replayed from the earlier months each
time, so editing an old month changes what every later month carries. Three
limits to know:

- **A month with no line for the category breaks the chain.** The next month
  starts from zero rather than carrying a balance across a month you never
  planned.
- **A month with rollover off passes nothing on**, even if the month before it
  rolled in something.
- **The replay looks back 24 months.**

## Starting the next month

Open a month you haven't planned and the page shows last month's lines as a
**draft**: the same categories and plans, with a **Draft — nothing saved yet**
badge. Looking ahead is a read and writes nothing. Nothing is saved until
you act.

- **Start *Month* from these** saves all of the previewed lines, with their
  rollover settings, as that month's budget. A notice says how many were carried
  over.
- A draft never includes a category that a window already covers that month.
- A draft carries nothing in. The balance a rolling line inherits depends on how
  the month before actually ends, so it shows once the lines are saved.

:::caution[Editing one draft line saves only that line]
The draft shows only while the month has no saved monthly lines. If you change a
single draft line, that line is saved and the rest of the preview goes, and the
button to carry the others over is no longer offered. Press **Start *Month* from
these** first, then edit.
:::

If the month before has no lines either, there is nothing to preview and the page
shows **Nothing budgeted yet**.

## Spent with no budget

At the bottom, **Spent with no budget** lists categories with spending that month
and no line, with a total. Without it, a category you forgot to plan and one you
never used would look the same, since both are simply missing from the lines.
The list is left out when there is nothing to show. Spending in a window's
category outside the window's dates lands here too.

## On the dashboard

The **Budget breakdown** widget shows the current month's lines as tiles, trouble
first. See [The dashboard](./dashboard#budget-breakdown). It reads only lines you
have saved: a month that is still a draft shows **No budget this month** there.

## What it doesn't do

- **Income isn't planned.** There are no income lines; recurring income is
  planned on the [Recurring](./recurring-items) page.
- **No shared household budget.** Each person on an instance has their own
  budget, and other people on the instance can't see it.
- **No alerts.** Nothing notifies you when a line goes over. The page and the
  dashboard are where you see it.
- **A parent's line doesn't add up its children.** A line measures only the
  transactions filed directly under its own category. Give each child its own line
  if you want to track them.
- **No history of plan changes.** Editing a plan replaces it.

## Backups and removal

The plan is in your [data export](./erasing-data#export-first). Turning the
Budgets plugin off keeps the lines and brings the page back when you turn it on
([Plugins](./plugins)).

For the endpoints, see [API reference](../api/overview#budgets).
