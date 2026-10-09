---
sidebar_position: 7
description: Budget account allowances, a monthly amount measured against one checking account, with rollover and category exclusions.
---

# Budget account allowances

A category line answers "how much have I spent on groceries". An **account
allowance** answers a different question: "I put $150 a month into this
checking account to spend on whatever, how much of it is left?" It is the
envelope idea, measured against an account rather than a category.

## Adding one

Use the **Account allowances** section of the Budgets page: pick a checking
account, the monthly amount, any categories it should **not** count, whether
unspent money rolls over, and an optional note. Only checking accounts can have
an allowance.

## What counts as spending

Everything that left the account during the month, with these exceptions:

- Transfers, and anything in an income or transfer category.
- Categories on the allowance's **Don't count** list. This is how holiday money
  sitting in the same account stays out of the number; give it a
  [window](./budget-windows) of its own.
- Split transactions count part by part, so an excluded part is left out and
  the rest counts.
- Refunds in a category reduce spending. An uncategorized deposit is not
  treated as a refund.

## Rollover

Rollover is on by default. What you didn't spend is added to next month's
allowance; an overspend carries forward as a negative. A month with no
allowance breaks the chain, and a month with rollover off neither receives nor
passes on anything.

## Where it shows up

- The Budgets page lists it with planned, carried in, spent and left.
- The Budget breakdown widget shows a tile named "&lt;account&gt; spending".
- Allowances are judged on the total, never on pace, so they are **over** only
  when overdrawn.
- They are kept out of the month's category totals and **Unbudgeted**, so
  nothing is counted twice.
- **Start from last month** copies allowances too.

## Upgrading

The change adds migration `027` (one new table, `plugin_budgets.account_lines`)
and gives the Budgets plugin read access to accounts. Both are applied at start
up; going back is possible, since the migration has a `down`.

An account with an allowance counts as **in use**: deleting it asks for the
usual confirmation and removes the allowances with it.
