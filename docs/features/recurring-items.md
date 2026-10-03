---
sidebar_position: 1
description: Recurring income, bills, debt payments and transfers, how they're modelled, and how editing, ending and deleting differ.
---

# Recurring items

**Recurring** (in the sidebar, after Transactions) holds the money you expect
to move on a schedule: paychecks, bills, card and loan payments, and transfers
between your own accounts. It's the data behind
[Until payday](./until-payday) and the [Forecast](./forecast), so those two are
only as good as what's entered here.

*Added in 0.2.0.*

## An item is a schedule plus legs

Each item has a **kind**, a **schedule**, and one **leg** per account it
touches. A leg is a signed amount on one account, the same way a transfer in
the ledger is two transaction rows rather than one row with a pointer:

| Kind | Legs | Example |
|---|---|---|
| **Bill** | One negative leg, on the account that pays it | Rent, −1,800 from Checking |
| **Income** | One or more positive legs | A paycheck split +2,000 to Checking and +300 to Savings |
| **Transfer** | Two legs that cancel out, on any two of your accounts | −200 from Checking, +200 to Sinking Funds |
| **Debt payment** | Two legs that cancel out; the receiving account must be a credit card or loan | −450 from Checking, +450 to the car loan |

The form asks for positive amounts and the kind supplies the sign. An item has
at most 10 legs, each account appears once, and a zero amount is refused,
because it moves nothing. A bill or income can have an optional category,
which must be an expense or income category to match. Transfers and debt
payments have no category, because they move money without spending it.

## Schedules

| Frequency | Shown as | Notes |
|---|---|---|
| `monthly` | Monthly | On the 29th–31st, clamps to the last day of shorter months |
| `biweekly` | Every 2 weeks | Counted from the first date |
| `semimonthly` | Twice a month | Two days you choose, 1st and 15th by default. The earlier day is the 27th at the latest, so the two never land on the same day in February |
| `weekly` | Weekly | |
| `quarterly` | Every 3 months | Clamps to month end like monthly |
| `annual` | Yearly | Clamps to month end (Feb 29 → Feb 28) |
| `once` | Once | A single future item, such as a one-off bill |
| `daily` | Daily | |

The **first date** is an anchor for the schedule. It is never shown as "due".
The **next due** date is always worked out on the server from the schedule and
your today (see [Time zone](./time-zone)). An optional **last date** ends the
series.

## Edit, end or delete

- **Edit** rewrites the whole series, past and future. It's for fixing a
  mistake, not for "from now on".
- **End** stops the series today. Nothing after today is expected, and the
  item moves behind **Show ended**. To change an amount from now on, end the
  old item and add a new one.
- **Delete** removes the item entirely and can't be undone.

## The monthly tiles

The tiles at the top total **Income**, **Bills and debt payments** and
**Left over**, per month. Each item is converted with exact factors rather than
rounded ones: biweekly is 26/12 a month, not 2.17, and weekly is 52/12.
Transfers between your own accounts aren't counted, because they don't change
what you have.

## Settings on the Accounts page

Two per-account settings feed recurring items. Both live on the Accounts page,
and only apply to checking and savings accounts:

- **Buffer**: the lowest balance you want to keep in the account. Until payday
  and the forecast warn before a bill takes the account below it. Zero or
  more; zero means no buffer.
- **Safe to spend**: whether the account counts toward Until payday's "safe
  to spend" total. Checking accounts start counted (existing ones were
  backfilled that way in 0.2.0, so nobody's number changed on upgrade). A
  savings account can opt in. A checking account you use for money set aside,
  such as yearly expenses, can opt out. It is still projected and still warned
  about, just not added to the total.

## Deleting an account, or moving its history

An account can't disappear from under a recurring item. When you delete an
account that has history, the dialog lists every recurring item with a leg on
it before anything happens, and what happens depends on the choice you make:

- **Delete the history**: each listed item is removed entirely, including a
  split paycheck's leg on another account. A forecast that silently pays less
  is harder to notice than an item that is gone.
- **Move the history to another account**: each item says what will happen
  to it once you pick the target.
  - **Moved**: the leg moves to the target account.
  - **Combined**: the item already has a leg on the target (a paycheck split
    across both, for example), so the two legs are added together and it keeps
    paying the same total.
  - **Removed**: a transfer or debt payment between the two accounts would
    become a transfer from an account to itself, so it's deleted.

## What isn't built yet

Matching expected items against the transactions that actually landed
("paid" or "arrived"), and one-off changes to a single occurrence (skip a
month, change one month's amount), are the next item on the
[roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md).
Until then, an item is expected on its scheduled date whether or not the money
has already moved.

For the endpoints behind this page, see [API reference](../api/overview#recurring-items).
