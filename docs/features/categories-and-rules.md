---
sidebar_position: 12
description: Categories, what each one counts as, the first-run setup wizard, and rules that file new transactions for you with a preview before they touch anything.
---

# Categories and rules

The **Categories** page (in the sidebar) is where the labels for your money live,
and where you teach Wicker Money to apply them for you. It is part of the core
app rather than a plugin: every plugin reads categories, so a fresh install with
no plugins still needs a way to manage them.

*Added in 0.1.0.*

## Setting up

A new account has no categories. The first time you sign in, a setup wizard asks
which circumstances apply to you, in six short steps: **Your home**, **Getting
around**, **Who else is in the picture**, **Health and protection**, **Work and
money** and **How closely do you want to track**. Examples are owning a home,
having a car payment, having pets, being self-employed, or paying down debt.

- Everyone gets the same base set of about 70 categories (housing, utilities,
  food, transport and so on). Each answer you tick adds the branches that only
  apply to some people, so the list stays short enough to read.
- A running total under the questions says how many categories, in how many
  groups, your answers would create. The last step's button is **Create
  categories**.
- **Not now** closes the wizard without recording anything, so it opens again next
  time. Whether setup is finished is kept on your account, not in the browser, so a
  new device doesn't ask again once you've finished.

Nothing is permanent. Categories can be added, renamed or deleted afterwards.

### Running it again

The **Starter categories** panel at the top of the Categories page says which
answers the setup was based on.

- **Run setup again** reopens the wizard with your previous answers ticked.
  Finishing adds only what is missing and touches nothing you have.
- **Reset setup** forgets the answers, and the wizard opens straight away.
  Categories are left alone, unless you tick **On reset, also delete the starter
  categories** first. That removes only categories from the starter set that
  nothing uses. Anything a transaction, split or rule points at is kept, named in
  the message, and so is any parent they pin. It is mostly useful for testing the
  wizard itself.

## Managing categories

Categories are **two levels deep**: a top-level category and the categories under
it. A parent's row opens and closes to show its children, with **Expand all** and
**Collapse all** above the table.

**Add category** asks for a **Name**, what it goes **Under** (the top level, or one
of the top-level categories) and what it **Counts as**. The name can be up to 100
characters. The page shows the slug it will be saved as, and a category whose slug
you already have is refused.

Each row has three buttons:

- **Edit** changes the name, the parent and what it counts as, in the row. Enter
  saves, Escape cancels. A top-level category that has children can't be moved
  under another, and a parent has to be top-level.
- **Disable** (and **Enable**) hides a category from every picker and keeps
  everything already filed under it. A transaction under a disabled category still
  shows it, so the row can't look uncategorized by accident. Disabling a parent
  disables its children. Enabling one doesn't enable them again.
  **Show *N* disabled categories** above the table brings them back into view.
- **Delete** works only on a category that nothing uses. If a transaction, split,
  rule, recurring item, budget line or a child category still points at it, it's
  refused with a count, and the message suggests disabling instead.

The **Slug** column is the category's identifier, made from the name when you
create it. It is never editable, because the starter set matches on it: renaming
`groceries` would make the next setup run create a second Groceries.

### What a category counts as

Every category counts as **Spending**, **Income** or **Transfer**.

| Counts as | Effect |
|---|---|
| **Spending** | Money out is spending. Money in against it, such as a refund, reduces what the category cost that month |
| **Income** | Money in is income |
| **Transfer** | Left out of both spending and income |

The reason is refunds and card payments. A $25 supermarket return is a positive
amount against Groceries. Going by the sign alone would call it income. Going by
the category keeps it a negative expense, which reduces the month's grocery
spending. A credit-card payment or a deposit into savings that you entered by hand
is money moving, not money earned or spent, so a **Transfer** category keeps it out
of the charts.

The rule, in order:

1. A real [transfer](./transfers) is a transfer, whatever its category.
2. Otherwise a category that counts as Transfer makes it one.
3. Otherwise the category's setting decides.
4. With no category, the sign decides, so a fresh import charts sensibly before you
   have sorted any of it.

Setting what a parent counts as sets it on its children too, so a "Transfers"
parent can't hold children that are still counted as spending. The starter set has
the right settings already: **Income** and its children count as income, and
**Transfers** (with **Between accounts**, **Credit card payment** and, if you
said you pay down debt, **Loan payment (principal)**) count as transfers.

[Budgets](./monthly-budgets) offer lines only for categories that count as
Spending, and the dashboard charts follow the same rule. See
[The dashboard](./dashboard).

## Rules

A rule files transactions into a category for you, so you aren't sorting every
statement by hand. **Add rule** opens a form:

| Field | What to enter |
|---|---|
| **Category** | Where matching transactions go. Disabled categories aren't offered |
| **Priority** | A whole number, 0 by default. A higher number wins |
| **Condition** | What must be true (below). **+ And another condition** adds more |

The condition types:

| Condition | Matches when |
|---|---|
| **Merchant contains** | The merchant text includes your text |
| **Merchant is exactly** | The merchant text equals your text |
| **Notes contain** | The transaction's notes include your text. Never matches a transaction with no notes |
| **Amount is exactly** | The amount equals the figure, in the direction you choose |
| **Amount is in a range** | The amount is at least and/or at most a figure, in the direction you choose |

Text matching ignores case unless you tick **Case-sensitive**. Text can be up to
500 characters. For amounts you type a positive figure and choose **Money out** or
**Money in**, so `375.00` with **Money out** means a payment of 375.00. You don't
type a minus sign. A range needs a minimum, a maximum or both. A transaction of
exactly zero matches no amount condition.

**Every condition on a rule must match.** That's how "merchant contains CHECK and
amount is exactly 375.00 out" stays separate from other cheques. There is no "or":
write two rules.

### Which rule wins

When more than one rule matches, the first of these decides:

1. The higher **priority**.
2. The rule with more conditions, since it's more specific.
3. The rule written first.

### Preview, then save

**Preview** counts what the rule would do, before it does anything: how many
uncategorized transactions it would file, and, if you've ticked **Also apply to
transactions already recorded**, how many already filed by an earlier rule it would
move. Categories you set by hand aren't counted. They are out of scope
entirely. The preview goes away when you change the rule.

**Save rule** then does it. Saving always files the uncategorized transactions it
matches, and the confirmation says how many existing transactions changed. The
extra box widens it to ones an earlier rule filed. **A category you set by hand is
never overwritten by a rule**, and transfer rows are never touched.

### Where rules apply

- **When you add a transaction** and leave the category on **Auto (apply rules)**.
- **On every row of a [CSV import](./csv-import)**, as it's written.
- **When you save a rule**, to what's already there (above).

They don't run when you edit a transaction later. A transaction filed by a rule
shows a **rule** tag in the Transactions table, and picking a category yourself
makes it yours.

The **Rules** panel lists your rules grouped under their category, each group
opening to a table of what it matches and its priority, with **Expand all** and
**Collapse all**. **Delete** removes a rule; **it leaves the transactions it already
filed as they are.** A rule can't be edited, so to change one, save the new
version and delete the old. A category that a rule points at can't be deleted.

## Working through what's left

Rules rarely cover everything. On the Transactions page, tick **Only uncategorized**
to see what's left. Select rows and use **Set *N* to** to file them in one go, or
choose a category on a single row. Transfer rows never appear in that list, because
they never take a category, so an empty list means everything is filed.

## Limits

- **Two levels.** There are no sub-subcategories.
- **Rules can't be edited or reordered**, only added and deleted, and there is no
  "or" inside a rule.
- **Rules read the merchant, the notes and the amount.** Not the account or the
  date.
- **The slug can't be changed.**
- **One category per transaction in the web app.** A transaction can be split
  across categories through the API, but the web app has no editor for it.

For the endpoints, see the `categories` area in the
[API reference](../api/overview#feature-areas).
