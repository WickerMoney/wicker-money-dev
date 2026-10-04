---
sidebar_position: 2
description: Matching recurring items to the transactions that paid them, and skipping, moving or changing a single occurrence.
---

# Matching: did it land?

A recurring item says what you **expect**. Matching records what actually
**happened**: you link a transaction to the occurrence it paid. After that,
[Until payday](./until-payday) and the [Forecast](./forecast) stop counting it
as still to come, so a paycheck that lands a day early isn't counted twice.

*Added in 0.3.0. Matching from the Transactions page, and dismissing a
suggestion, added in 0.4.0.*

Matching is optional. An item you never match behaves exactly as it did
before matching existed.

## Suggestions, never automatic

Nothing is matched until you click. The app only suggests matches.

- **Candidates** for an occurrence are unmatched transactions on the same
  account, going the same way (money out for a bill, in for income), within
  10 days of the expected date.
- A candidate becomes a **suggestion** only when it is within 5 days and
  within 25% of the expected amount. Each transaction is suggested for one
  occurrence at most.
- The Recurring page lists suggestions under **Did these land?**, covering
  occurrences from two weeks ago to a few days ahead. Confirm one with
  **Match**.

One transaction settles at most one occurrence. An occurrence with several
legs, such as a split paycheck, is settled by one transaction per leg. For a
transfer, matching one row also links its partner row when it's on the item's
other leg.

## The History panel

Each item on the Recurring page has a **History** panel. It lists the item's
recent and coming occurrences and what paid each one. From there, a single
occurrence can be changed without touching the rest of the series:

| Action | What it does |
|---|---|
| **Find payment** / **Match** | Pick the transaction that paid it, from the candidates above |
| **Unmatch** | The transaction no longer settles it. The transaction itself is unchanged |
| **Skip** / **Un-skip** | It won't happen this time. A skipped occurrence can't be moved or matched, and one a transaction already settles can't be skipped |
| **Change** | Move it to another date (up to 31 days either way), or give it a different amount on each account, so one side of a split paycheck can change. A transfer must still net to zero |

To change an item from now on, rather than one occurrence, end it and add a
new one (see [Recurring items](./recurring-items#edit-end-or-delete)).

## Late and missed

An item you have matched at least once is **tracked**, from the date of its
first matched occurrence. Earlier occurrences, and every occurrence of an
item you never match, are **assumed** to have happened on their date, which
is what every projection did before matching existed.

For a tracked item, an occurrence that hasn't been matched by its date is:

| Status | When | Counted in projections? |
|---|---|---|
| **Due** | Expected today | Yes, from tomorrow, since today's balance doesn't include it |
| **Late** | Expected up to 7 days ago | Yes, on the first projected day |
| **Missed** | Expected more than 7 days ago | No |

The other statuses are **upcoming** (after today), **cleared** (every leg
matched; its money is already in the balance) and **skipped**. Until payday
and the Forecast tag arrived and late occurrences.

Until you confirm a suggestion, a late occurrence whose payment has already
posted is counted twice: once in today's balance and once as still to come.
That's deliberately pessimistic. Confirming the match fixes it.

## From the Transactions page

The Transactions page has a **Recurring** column. For each transaction it
shows one of:

- the occurrence it paid, with **Unmatch**;
- a suggested occurrence, with **Match** and **Not this**;
- **Other**, to pick an occurrence yourself from the ones the transaction
  could settle, best first.

The column costs one request per page of transactions, not one per row.

## Dismissing a suggestion

**Not this** dismisses a suggestion, on either page, and that
transaction-and-occurrence pair is never suggested again. The same
transaction can still be suggested for a different occurrence.

- **Undo** brings a dismissed suggestion back. On the Recurring page,
  dismissed suggestions are listed under **Did these land?** with an Undo
  button each.
- Matching a dismissed pair by hand clears the dismissal.
- Dismissing one row of a transfer dismisses its partner row too.
- A dismissal is kept against the item and the occurrence's scheduled date,
  so it survives the occurrence being reset. It's deleted with the
  transaction or the item, and it's included in the data export.

## Editing an item that has matches

Editing an item still rewrites the whole series. Per-occurrence amounts that
no longer fit the item's legs are removed. Other per-occurrence changes on
dates that are no longer on the schedule are kept but ignored.

For the endpoints behind this page, see
[API reference](../api/overview#matching-and-occurrences).
