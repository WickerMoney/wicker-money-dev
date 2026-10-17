---
sidebar_position: 10
description: The Debt payoff plugin — list your loans and cards, pick snowball or avalanche, and see the date you'll be debt free and the interest it saves.
---

# Debt payoff

**Debt payoff** answers one question: *when will I be debt free?* You list the
loans and credit cards you owe on, choose a strategy and an extra amount to pay
each month, and the page shows the date the last one is cleared, the interest
it will cost, and how much that beats paying only the minimums.

*Added in 0.6.0, as a bundled plugin (`wickermoney.debt-payoff`).* It
shows up as **Debt payoff** in the main navigation and as a **Debt-free date**
widget on the dashboard. Like every plugin, an owner can turn it off from
[Settings → Plugins](./plugins); its debts are kept while it's off.

## Adding your debts

**Add a debt** opens the shared form dialog (a side drawer on a computer, a
full-screen sheet on a phone) with:

| Field | What to enter |
|---|---|
| Name | Anything you'll recognise |
| Balance | What you owe today |
| Interest rate (% a year) | The yearly rate (APR) as a percentage, such as `24.99`. `0` if there is none |
| Minimum payment (a month) | The least the lender asks for each month |
| Linked account (optional) | One of your loan or credit card accounts. See below |

You can edit a debt at any time, **archive** it (it stays, but leaves the list
and the plan) or remove it for good. You can have up to 50 debts that aren't
archived; archive the ones you've paid off to make room.

**The balance is the one you type.** Wicker Money does not sum a debt's balance
from your ledger. Linking an account ties the debt to a loan or card you track,
so the page can offer "start from one of your accounts" and show which account a
debt is, and it stops two active debts counting the same account twice. It
doesn't keep the balance in step: when you pay a debt down, update the balance
here to move the plan on. Only a loan or credit card account can be linked, and
a debt can't be linked to an account another active debt already tracks.

## Snowball or avalanche

| Strategy | Aims extra money at | Why you'd pick it |
|---|---|---|
| **Avalanche** (the default) | The highest interest rate first | Costs the least interest |
| **Snowball** | The smallest balance first | Clears whole debts sooner, which some people find easier to stick with |

Ties go the way that costs you nothing: a snowball tie goes to the higher rate,
an avalanche tie to the smaller balance, and any tie after that keeps the order
of your list. The order is worked out once, from today's balances and rates, and
the page shows it ("payoff order") so you can read off who is next.

**Extra each month** is what you'll pay on top of the minimums. Your strategy
and extra are saved, and the dashboard widget uses the same ones, so the two
always agree.

## What you see

- **Debt-free date**, how many months that is, and the **total interest** the
  plan costs.
- **What it saves**: the months and interest saved against paying only the
  minimums (the plan runs that comparison alongside).
- A **balance chart** of what you owe month by month, with a **Show as table**
  view of the same numbers.
- The **payoff order** with each debt's own payoff date.
- The **assumptions**, written on the page, because a payoff date is only as
  good as the rules behind it.

The dashboard widget, **Debt-free date**, shows the date and the next debt in
line; at a larger size it adds what the plan saves. It never shows a date it
doesn't have: a plan that doesn't finish says so.

## How the plan is worked out

The page does no money arithmetic of its own. It asks the server for a plan, and
the server computes it exactly, in whole units of 0.0001, with no floating point
anywhere:

- **Interest** is the nominal yearly rate divided by 12, times what the debt
  owed at the start of the month. Payments are made at the end of the month,
  starting a month from today, so a debt's last payment is its balance plus that
  month's interest.
- **Rounding.** Interest is rounded once for each debt each month, to four
  decimal places, with halves rounded away from zero. Nothing else is rounded,
  so the totals add up exactly.
- **The same payment every month**: your minimums plus the extra. When a debt is
  paid off, its minimum moves on to the next debt in line. A minimum larger than
  what's owed pays only what's owed.
- **The plan stops at 600 months** (50 years). If something is still owed by
  then, for example because a minimum never covers the interest, the plan says
  so and shows no debt-free date, rather than inventing one. Raise the extra to
  bring an end date into view.

What it leaves out: new spending, fees, rate changes and promotional rates.
Lenders round to the cent and some work out interest daily, so a real statement
can differ from the plan by a little. Treat it as an estimate on a stated
convention, and re-enter your balances now and then.

## Your data

- Debts and your plan settings are stored in the plugin's own tables, under
  [row-level security](../contributing/architecture) like the rest of the data,
  so each account sees only its own debts.
- The plugin can **read your accounts** (to offer the loan and card list and to
  check a link) and nothing else of the app's data. It never reads another
  plugin's tables.
- Your debts, archived ones included, and your saved plan settings are in the
  [data export](./erasing-data#export-first), and
  [erasing your data](./erasing-data) empties them.
- Deleting an account **with its history** keeps the debt and removes only its
  link. A plain delete is refused while a debt is linked to the account, and the
  account's usage summary counts it ("1 debt").

For the endpoints, see [API reference](../api/overview#debt-payoff).
