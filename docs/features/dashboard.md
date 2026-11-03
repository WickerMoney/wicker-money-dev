---
sidebar_position: 15
description: The dashboard, a page of widgets from your plugins on one shared time range, and what each bundled widget shows.
---

# The dashboard

The **Dashboard** is the first page you land on. It doesn't draw anything itself:
every card on it is a widget contributed by a [plugin](./plugins), and the app only
provides the grid and one control, the time range. Turn a plugin off and its
widgets leave the dashboard. Turn it back on and they return.

*Added in 0.1.0.*

## The time range

One control at the top right sets the period for the whole dashboard:

| Choice | Covers |
|---|---|
| **This month** | The current month |
| **3 months** | The current month and the two before it |
| **6 months** | The current month and the five before it |
| **12 months** | The current month and the eleven before it (the default) |
| **24 months** | The current month and the twenty-three before it |
| **Year to date** | January up to and including the current month |

There is one control, not one per card, on purpose. Two charts side by side that
show different periods while looking alike is the way a dashboard misleads.
Widgets read the range and can't change it, or see each other.

- **Ranges end at the end of the current month**, not today. A last bar that is a
  part-month and shrinks as you look at it invites comparing half a month with
  whole ones.
- **Where a month starts depends on you**, not the server: the month is worked out
  in your [time zone](./time-zone).
- **The choice is remembered** in this browser, so it comes back the next time you
  visit. It is not tied to your account, so another browser or device starts on 12
  months.
- **Not every card uses it** (see below). A card about a window of its own, such as
  Until payday, ignores the range.

The control only appears when at least one widget is installed.

## The layout

Plugins say which of two areas a widget belongs in, how big it is and where it
sits among the others; the app lays them out.

- **The main area** is two columns. Half-width cards (Until payday, Budget
  breakdown) sit side by side, and full-width cards (the two charts) take a row each.
- **The second area** holds smaller cards, which wrap to fit the width.
- **On a phone or a narrow window** (under 860 pixels wide) the main area is a
  single column.

You can't rearrange cards or hide one on its own. To remove a card, turn off the
plugin that provides it, in **Settings → Plugins** ([owners only](./owners-and-members)).
With no widgets at all the page says **No widgets installed**.

A card that throws while drawing shows "*Plugin · Card* failed to render", the
error and a **Try again** button inside its own card. The others keep working.

## What's on it

The bundled plugins contribute these, in the order they appear:

| Card | Plugin | Uses the range | What it answers |
|---|---|---|---|
| [Until payday](./until-payday) | Upcoming | No | Will I make it to payday? |
| [Budget breakdown](#budget-breakdown) | Budgets | No | How is this month's budget going? |
| [Money in and out](#money-in-and-out) | Insights | Yes | Is more coming in than going out? |
| [Spending trends](#spending-trends) | Spending Trends | Yes | What are my biggest categories doing? |
| [Where it went](#where-it-went) | Insights | Yes | What did the money go on? |
| [Debt-free date](./debt-payoff) | Debt payoff | No | When will I be debt free? |

### Budget breakdown

The current month's [budget](./monthly-budgets) as a set of tiles, with the ones
that need attention first. Each tile shows the category, what is **left** (or how
much it is **over**), the amount spent of what is available, and a bar with a mark
for today. A [window](./budget-windows) shows as the whole pot, with its mark at how
far through its dates you are, and an
[account allowance](./budget-account-allowances) appears as "*Account* spending".

- **Order**: lines that are over come first, then those spending faster than the
  month is arriving, each worst first. Then the rest by how much of their budget is
  used, and lines with nothing spent last.
- **Up to six tiles** show. When there are more lines, an **All *N* lines** button
  opens the Budgets page.
- **The footer** says how many lines need attention out of how many there are
  (counting up to four), or that all are on pace, and how much of the month's
  available budget is spent, not counting allowances.
- It reads only lines you've **saved** for the current month. A month that is still
  a draft on the Budgets page shows **No budget this month** here, with a pointer to
  that page.

### Money in and out

Income against spending by month. Income is drawn above a single zero line and
spending below it, on one scale, so a bar of a given size is the same height
whichever way it points and the gap between the two is the month's net. Every month
in the range gets a slot, including empty ones, so March and September never sit
side by side as if consecutive. Hover or focus a month for its figures, or press
**Show as table** for the same numbers as a table.

### Spending trends

Monthly spending stacked by category. The five largest categories over the range
are named and the rest fold into **Other**. The chips above the chart are the
legend and a filter: turn a category off and it leaves the bars and the axis
refits.

### Where it went

A donut of spending by category over the range, with a legend. The five largest
categories are named and the rest fold into **Other**. The centre shows the total,
or the figure for the slice you hover. Income isn't counted: this is a question
about outflow.

### What the charts count

The three charts read the same totals as the rest of the app:

- **Transfers aren't counted**, either [transfer](./transfers) rows or a category
  that [counts as a Transfer](./categories-and-rules#what-a-category-counts-as).
- **A category's kind decides**, so a refund in a spending category reduces
  spending rather than showing as income.
- **An uncategorized transaction is counted by its sign**, and appears under
  "Uncategorized", so a fresh import charts sensibly before you've sorted it.
- **Split transactions count part by part**, each part in its own category.

A chart with nothing to draw says so, for example "Nothing in the last 12 months"
or "No spending in this range". Widen the range to look further back.

## Cards that run in a frame

Where a card's code runs depends on its plugin. Since 0.7.0 every card except
Budget breakdown runs in a sandboxed frame: Until payday (Upcoming), Money in
and out and Where it went (Insights), Spending trends and Debt-free date (Debt
payoff). Budget breakdown, from Budgets, still runs in the app's own page. You
don't have to do anything about it: both kinds sit in the same card on the grid.
The sandbox is covered on [Plugins](./plugins#how-much-a-plugin-is-trusted).

**Frames start when you scroll to them.** *Added in 0.7.0.* A card that runs in a
frame doesn't load its frame until the card is within about 600 pixels of the
window. Until then it holds a placeholder about the widget's height, so the page
doesn't jump when the frame arrives. The cards in the first screen start as the
page loads, a card you have scrolled past stays loaded, and a browser that can't
tell when a card is near (no `IntersectionObserver`) loads them all at load, as
before. Two things to know:

- **Find in page and printing only see cards that have started.** Text in a card
  that is still a placeholder isn't found, and a print preview of a dashboard you
  haven't scrolled shows placeholders for those cards. Scroll to the bottom
  first, or use a tall window, when you need either.
- **A hidden tab doesn't fail a card.** The "plugin did not start in time" timer
  starts when the frame is created and stops while the tab is hidden, so a
  dashboard left in the background doesn't report a widget as broken.

On the maintainer's seeded dashboard (Chromium, one machine) the gain was small:
the first screen came up about 225 ms sooner on a desktop window and about 320 ms
sooner on a phone, and the browser held 3 MiB (desktop) to 18 MiB (phone) less
memory at load, until you scroll. It pays
more as a dashboard gains frame cards than fit on a screen.

## What it doesn't do

- **No drag, resize or per-card settings.** The layout comes from the plugins.
- **No cross-card interaction.** Choosing a month in one chart doesn't filter
  another.

## Where it connects

Every number on the dashboard comes from something you entered elsewhere:
[transactions](./transfers) and [categories](./categories-and-rules) for the
charts, the [Budgets](./monthly-budgets) page for the breakdown,
[recurring items](./recurring-items) for Until payday, and
[Debt payoff](./debt-payoff) for the debt-free date. [CSV import](./csv-import) is
how most of it gets there.
