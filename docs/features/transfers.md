---
sidebar_position: 13
description: Transfers between your own accounts, recorded as a linked pair of rows so they count as neither income nor spending and every balance stays right.
---

# Transfers

Moving money between your own accounts is neither earned nor spent. Counting it
as either is the biggest single way a spending chart overstates, so Wicker Money
records a transfer as its own thing: **two linked rows**, one on each account.

*Added in 0.1.0.*

## Recording one

On the **Transactions** page, press **Add transaction** and switch the toggle at
the top of the dialog from **Spending or income** to **Transfer**.

| Field | What to enter |
|---|---|
| **From account** | The account the money leaves |
| **To account** | The account it arrives in. The account you chose as the source isn't offered |
| **Amount** | A positive amount. Which account it leaves sets the direction |
| **Date** | The day it moved |
| **Description** | Optional, up to 300 characters |

Press **Move money**. Both rows are written together, or neither is. An amount
of zero or less is refused, and so is a transfer from an account to itself.

Any two of your accounts will do, whatever their types, so paying a credit card
or a loan from checking is a transfer too. A balance is the account's opening
balance plus its rows, so the positive row raises the destination's balance by the
amount and the negative row lowers the source's.

If you leave the description empty, the row on the source account reads
**Transfer to *Account***, and the row on the destination reads **Transfer from
*Account***. If you give one, both rows carry it.

## Two rows, one event

A transfer is a pair: a negative row on the account the money leaves and a
positive row on the account it reaches, sharing one link. Balances are derived
from the ledger, so a single row would take money out of one account and put it
nowhere. Every balance after it would be short, and the missing money would turn
up in the spending chart instead.

In the Transactions table, a transfer row shows a **transfer** tag where the
category would be, and has no category picker.

### Editing

**Edit** on either row opens the usual dialog with a note: "This is one side of a
transfer. Saving also updates the other side." What carries over:

- **Amount**: the other row gets the same amount with the opposite sign.
- **Date**: the other row moves to the same date.
- **Merchant** (the label) and **notes** change on the row you edit only.

A row keeps its direction. You can change the amount, but not make it zero or flip
its sign. To reverse a transfer, delete it and record a new one. The accounts and
whether something is a transfer can't be edited at all: an ordinary transaction
can't be turned into a transfer. Delete it and record a transfer instead.

### Deleting

**Delete** on either row removes both, after a confirmation that says so. A
half-deleted transfer would be money that left one account and arrived nowhere.
Afterwards a [notification](./notifications) says the transfer's amount and that
both sides were removed.

### Categories

A transfer row can't take a category, and a [rule](./categories-and-rules#rules)
never files one. When you categorize several transactions at once, any transfer
rows among them are skipped. A transfer also can't be split. Uncategorized
transfer rows don't appear under **Only uncategorized**, so that list can be
worked down to empty.

## How other features treat transfers

A transfer is left out of everything that measures earning or spending:

- **Budgets.** Neither row counts as spending in a
  [monthly line](./monthly-budgets#what-counts-as-spending) or an
  [account allowance](./budget-account-allowances#what-counts-as-spending).
- **Charts.** The money-in-and-out and spending charts on the
  [dashboard](./dashboard) leave both rows out.
- **Account balances.** Both accounts change, which is the point.

And one feature is *about* them: a [recurring item](./recurring-items) of kind
Transfer (or a debt payment) is the schedule behind one you make every month.
When the real pair lands, [matching](./matching) links one row and its partner
row together to the occurrence.

## A transfer that isn't recorded as a pair

Not every transfer will arrive as a pair. A bank statement for a card lists your
payment on the card's account, and your checking statement lists the same payment
going out. [CSV import](./csv-import) reads each file as ordinary transactions and
never creates a transfer, so importing both leaves two unlinked rows.

For that case, a category can **count as a Transfer** (see
[Categories and rules](./categories-and-rules#what-a-category-counts-as)). The
starter set has **Transfers** with **Between accounts**, **Credit card payment**
and, if you said you were paying down debt, **Loan payment (principal)**. Money
filed there is left out of spending and income like a real pair. The difference
is that each row only changes its own account's balance, so both statements must
be imported for the balances to agree. For a payment you enter by hand, the
Transfer form is simpler and can't leave one side behind.

## Limits

- **Two accounts only.** A transfer can't be split across three, and it has one
  amount. A paycheck that is split between accounts is a
  [recurring income item](./recurring-items#an-item-is-a-schedule-plus-legs), not
  a transfer.
- **No currency conversion.** Both rows carry the same amount.
- **Deleting an account.** If you delete an account together with its history,
  the other row of any transfer is removed too, even when it is on a different
  account. The dialog says so before anything happens.
- **Moving an account's history to another account.** Transfers between those two
  accounts are removed rather than moved, since they would become a transfer from
  an account to itself. The dialog counts them first.
- **Importing from code.** The API accepts an optional `externalId` on a
  transfer, stored on both rows and unique per account, so sending the same
  transfer twice answers `409 duplicate_external_id` instead of writing a second
  copy. Neither row is written when either account already has that id. See the
  [API reference](../api/overview#feature-areas).

## Where it connects

- [Recurring items](./recurring-items) plans the transfers you make regularly,
  and [Until payday](./until-payday) and the [Forecast](./forecast) project them.
- [Budgets](./monthly-budgets) and the dashboard leave them out.
- [Matching](./matching) links a transfer pair to the occurrence it paid.
