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

*Since NEXT_VERSION it runs in a sandboxed frame,* as do the Forecast page and the
Until payday widget, and no longer in the app's own page. It looks and behaves
as before: the add, edit and remove dialogs still open as a side drawer or a
phone sheet over the page, the page behind stays where it was, Tab stays in the
dialog, and Escape returns focus to the button that opened it. See
[How much a plugin is trusted](./plugins#how-much-a-plugin-is-trusted). Its
results are shown on the page itself, not in a [notification](./notifications).

## Adding your debts

**Add a debt** opens the shared form dialog (a side drawer on a computer, a
full-screen sheet on a phone) with:

| Field | What to enter |
|---|---|
| Name | Anything you'll recognise |
| Balance | What you owe today |
| Interest rate (% a year) | The yearly rate (APR) as a percentage, such as `24.99`. `0` if there is none |
| Minimum payment (a month) | The least the lender asks for each month |
| Extra each month toward this debt (optional) | Paid to this debt on top of its minimum. See [An extra amount for one debt](#an-extra-amount-for-one-debt) |
| Linked account (optional) | One of your loan or credit card accounts. See below |
| Timing and interest (optional) | A section for deferment, promotional rates and how interest is worked out. See [Loans, promotions and compounding](#loans-promotions-and-compounding) |
| Include in the payoff plan | On by default. See [Leaving a debt out of the plan](#leaving-a-debt-out-of-the-plan) |

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

**Extra for all debts (follows the strategy)** is what you'll pay on top of the
minimums, aimed at one debt at a time by the strategy. Your strategy and this
extra are saved, and the dashboard widget uses the same ones, so the two always
agree. To pay extra toward one particular debt, set it on that debt.

## Leaving a debt out of the plan

*Added in NEXT_VERSION.* Each debt in the list has an **In plan** checkbox, saved the moment
you change it, like *Safe to spend* on Accounts. Switch it off for a debt that
would swamp the rest, such as a mortgage that holds the debt-free date decades
out.

- A debt that is switched off stays in your list, muted and marked **Not in
  plan**. It is left out of the chart, the schedule, the totals, the payoff
  order, the money that moves on when another debt is paid off, and the
  debt-free date.
- The headline and the dashboard widget say what they leave out ("Debt free
  (excluding Mortgage) on …"), and the page lists the debts that are not in the
  plan. With every debt switched off, the page says nothing is in the plan.
- It still counts toward the limit of 50 debts. **Archiving** is different and
  unchanged: an archived debt leaves the list as well as the plan, and frees a
  slot.

## An extra amount for one debt

*Added in NEXT_VERSION.* A debt can have its own monthly extra, set in **Extra each month
toward this debt** and shown in the list when it isn't zero.

- It is paid after the minimums and before the shared extra is spread by your
  strategy, and it comes **on top of** the shared extra.
- It does **not** join the shared pool. When that debt is paid off, its extra
  stops instead of moving to another debt, so the debt-free date can move later.
  Freed *minimums* still roll over as before. To keep the money working, raise
  another debt's own amount or the shared extra.
- When any debt has one, the page says "Each month: *amount* pooled + *amount*
  earmarked for single debts, until each is paid off", and the monthly total is
  labelled "Pooled each month".
- If the amount is more than the debt owes, the page says the debt is paid off in
  the first month and the rest isn't used, which is usually a typo.
- It is ignored for a debt that is left out of the plan, archived or already at
  zero. The comparison with paying only the minimums ignores it too, along with
  the shared extra.

A debt with no extra amount, in a plan where nothing else below is used, gets
exactly the plan it got before.

## Loans, promotions and compounding

*Added in NEXT_VERSION.* The **Timing and interest (optional)** section of the debt form
opens by itself when a debt already uses it.

**A loan in deferment.** Enter **Repayment starts on**: the first day you must
pay. Until the first plan month whose payment date is on or after it, no minimum
is due, the extra money skips the debt (only an amount set on that debt can pay
it early) and interest keeps adding to its balance. Its minimum joins the monthly
payment when it starts, so the monthly total can rise. The page says what the
loan will owe by then, and the debt's row says "Repayment starts" with the date.

**A promotional rate.** Enter a **Promotional rate (% a year)**, such as `0`,
and the day it ends. The debt uses that rate through the last payment on or
before that day, then its normal rate. Both fields go together; one without the
other is refused.

**Deferred interest.** Tick *Interest is charged back to the start if it is not
paid off by then* and the plan treats the promotion as a deadline. Before it
spreads the rest of your money, it pays that debt the even amount that clears it
by the end date, as far as your monthly payment allows. If that is not enough,
the page says how much interest back to the start would be added and how much
more a month would clear it in time, and the interest is added in the promotion's
last month. **Charged on** decides what the backdated interest is worked out on:
**the original balance** (the default, and the cautious estimate: most issuers
charge on it whatever you pay in the meantime) or **the balance as it falls**.
This is an estimate; check your agreement.

**How interest is worked out.** For each debt, **Monthly** (the default, as
before: the yearly rate divided by 12), **Compounded daily** (typical of credit
cards), or **Simple daily interest**, which charges on what you borrowed and
adds the interest to the balance when repayment starts (typical of student
loans). The daily options use the real number of days between payment dates.

A debt that uses none of this gets exactly the plan it got before.

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

- **Interest**, unless a debt says otherwise, is the nominal yearly rate divided
  by 12, times what the debt owed at the start of the month. Payments are made at
  the end of the month, starting a month from today, so a debt's last payment is
  its balance plus that month's interest. A debt set to daily compounding or
  simple daily interest uses the days between payment dates instead (see
  [above](#loans-promotions-and-compounding)).
- **Rounding.** Interest is rounded once for each debt each month, to four
  decimal places, with halves rounded away from zero. Nothing else is rounded,
  so the totals add up exactly.
- **The same payment every month**: your minimums plus the extra for all debts.
  When a debt is paid off, its minimum moves on to the next debt in line. A
  minimum larger than what's owed pays only what's owed. Amounts set on single
  debts are paid on top and stop with their debt.
- **The plan stops at 600 months** (50 years). If something is still owed by
  then, for example because a minimum never covers the interest, the plan says
  so and shows no debt-free date, rather than inventing one. Raise the extra to
  bring an end date into view.

What it leaves out: new spending, fees and rate changes other than a promotion
you enter. Lenders round to the cent, so a real statement can differ from the
plan by a little. Treat it as an estimate on a stated
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
