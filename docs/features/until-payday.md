---
sidebar_position: 3
description: The "Until payday" dashboard widget, how safe to spend is worked out, and why accounts are never pooled.
---

# Until payday

**Until payday** is a dashboard widget that answers one question: *will I make
it to payday?* It comes from the bundled plugin `wickermoney.upcoming`
(`plugins/upcoming`), which is read-only and holds the `recurring_items` and
`accounts` grants and nothing else.

*Added in 0.2.0.*

## The window

The widget looks from **tomorrow** through the **next payday**, inclusive. The
next payday is the earliest expected income into any of your accounts. With no
income expected, it looks 14 days ahead and says so.

It starts from tomorrow because today's actual balance is the starting point,
so anything that already posted today isn't counted twice.

## What it shows

- **Safe to spend**: the total you can spend before payday without any counted
  account dropping below its buffer.
- **Each account's outlook**: every checking account, plus any savings account
  marked *Safe to spend*. For each one, its **lowest point** in the window and
  its **room above buffer** (lowest point minus buffer). An account that isn't
  counted toward safe to spend is still listed, marked *not counted*.
- **A shortfall banner** for any listed account that dips below its buffer,
  naming the account, the day, and how far below it goes.
- **Coming up**: what lands before payday. Transfers between your own accounts
  are hidden unless you tick **Show transfers**.

## The rules behind the number

These come from the recurring-items design decisions, and the
[Forecast](./forecast) follows the same ones:

- **Accounts are never pooled.** Each account is projected on its own. One
  account's surplus doesn't cover another's shortfall, because the bank
  doesn't do that either. A transfer moves money between the two accounts it
  touches.
- **Outflows clear before inflows on the same day.** Each day's low point
  assumes the bill goes out before the paycheck arrives, so rent due on payday
  shows as the dip it is if the paycheck lands late.
- **Safe to spend is the sum of positive room** across the counted accounts.
  A short account adds nothing, and isn't netted against the others either. It
  gets the banner instead.
- **"Today" is yours, not the server's or the browser's.** It's your calendar
  day in your account's [time zone](./time-zone), worked out on the server.

## Setting it up

1. Add your paychecks, bills and transfers on the [Recurring](./recurring-items)
   page.
2. On the Accounts page, set each checking account's **buffer**, and choose
   which accounts count toward **safe to spend** (checking accounts do by
   default; savings can opt in).
3. Check **Settings → Time zone**.

The widget sits in the dashboard's main row, beside **Budget breakdown** when
the budgets plugin is enabled.

## Limits

The widget projects the **schedule**. It doesn't know about everyday spending
that isn't a recurring item. It does know what you've
[matched](./matching): a matched occurrence is already in the balance and isn't
counted again, skipped and moved occurrences follow your change, and on an
item you track, a late occurrence is still counted, on the first day of the
window.
