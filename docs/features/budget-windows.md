---
sidebar_position: 6
description: Budget windows, one amount for one category across a date range, and how they show up month by month.
---

# Budget windows

The Budgets page (bundled plugin `wickermoney.budgets`) plans one line per
category **per calendar month**. A **window** is the exception: one amount for
one category across a date range, spent down to zero. Holiday gifts are the
typical case: the money lands on October 1 and is spent until December 25, and
what you want to see is "spent so far, and what's left", not a new amount every
month.

*Added in 0.3.0.*

## Adding one

Use the **Windows** section of the Budgets page: pick a category, the first and
last day (both included), the amount, and an optional note. A window row
shows its dates and "spent so far of funded", with **Edit** and
**Remove window**.

A category can't have two lines on the same day, window or monthly. The
database enforces it, and saving a window whose dates overlap another line for
that category is refused with a message saying so.

## How a window reads month by month

In each month a window touches, its line shows what a hand-built rollover
chain would:

| | First month | Later months |
|---|---|---|
| **Planned** | The full amount | 0 |
| **Carried in** | 0 | What was left at the end of the month before |
| **Spent** | That month's spending in the category | That month's spending in the category |
| **Left** | Funded minus spent so far | Funded minus spent so far |

The full amount counts as planned only once, in the first month, so totals
never fund the window twice.

## What's different from a monthly line

- **No "at risk" for pace.** Pace is measured across the whole window, but
  bunched-up spending is the point of a window, so it's never flagged as at
  risk. Only an overdrawn window is marked **over**.
- **Spending outside the window's dates** in that category shows as
  unbudgeted, the same as any category without a line.
- **Starting a month from last month's lines** skips categories a window
  covers that month.
- **Rollover** between monthly lines ignores windows.
- What's left after the window ends isn't carried anywhere. Move it by hand
  if you want it in a monthly line.

## Amounts

A window's amount, like a monthly line's, is a decimal amount with at most four
decimal places. Since 0.3.0 a fifth decimal place is refused rather than
quietly cut off, the same as the rest of the API.

For the endpoints, see
[API reference](../api/overview#budgets).
