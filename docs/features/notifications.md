---
sidebar_position: 16
description: How Transactions, Recurring, Accounts, Categories and Settings say what an action did, in a notification that stays until you close it.
---

# Notifications: what an action did

When you do something on Transactions, Recurring, Accounts, Categories or
Settings, the page says what happened in a **notification** at the top of the
page: "Deleted 'Coffee' (-$4.50)." rather than a line that fades or a bare
"Done".

*Added in NEXT_VERSION.*

## How they behave

- **Nothing closes itself.** A notification stays until you close it with its
  **Close** button, or with **Escape** while it has focus, or until the next
  action of the same kind replaces it. Close one and focus goes back to where it
  was.
- **There is no Undo.** A notification reports a result; it doesn't offer to take
  it back. (Where an undo exists it is a button on the page itself, such as
  **Undo** beside a dismissed suggestion on Recurring, or **Undo** on a past
  CSV import.)
- **A repeat replaces the last one.** Deleting two transactions in a row leaves
  one notification, the second, and it is announced again.
- **It sits at the top of the page content.** It pushes the page down rather than
  covering it, and on a phone it stays in view under the top bar as you scroll.
- **At most three show at a time** (two on a phone). Others wait their turn and
  appear as room frees up, and an error goes ahead of the queue. From two on,
  **Dismiss all** closes the ones showing.
- **A screen reader hears each one once**, politely, without focus moving. A
  warning or an error is read as "Warning:" or "Error:" first. The visible
  stack is not itself announced a second time.
- **A refusal is an error.** A row action the server refuses is an **error**
  notification, read out with "Error:" first, not a success.
- **A dialog goes first.** A notification raised while a dialog is open is held
  back, for up to two seconds, so it doesn't appear under the dialog; the page
  closes the dialog and then says what happened. A problem that belongs to a form
  stays on the form, and a refusal raised from inside a dialog stays in the
  dialog.

The red banner at the top of a page is now only for a list that **failed to
load**. Form problems are still shown on the field or the form they belong to.

## What says what

| Page | Actions that raise a notification |
|---|---|
| Transactions | Deleting a transaction (it says what was deleted, and a transfer says both sides were removed), saving an edit, setting a category, categorizing several at once ("12 transactions updated."), matching, unmatching, **Not this** and **Restore** on a recurring suggestion |
| Recurring | Adding, updating, ending and deleting an item; confirming or dismissing a suggestion; skipping, moving or matching an occurrence |
| Accounts | Adding, renaming, archiving, deleting or moving an account; correcting an opening balance; the safe-to-spend checkbox |
| Categories | Adding, editing, disabling or deleting a category or a rule; resetting the starter setup |
| Settings | The time zone, a plugin switch, a role change and the data export |
| Setup wizard | Finishing it |

The old "Downloaded." and "Saved." lines, and the announcement of a role change
under the People table, are gone: the notification replaces them.

## What doesn't use them

- **Plugin pages and widgets.** Budgets, Import CSV, Debt payoff and the rest
  show their results inline, as they did. A notification is part of the app's own
  pages for now; there is no way for a plugin to raise one yet (see
  [Writing a plugin](../contributing/plugin-authoring#toasts-row-detail-and-the-link-icon-ui-kit)).
- **A failed plugin switch** is still shown on the plugin's own card in Settings
  → Plugins; a successful switch raises a notification ("Turned on *Name*.").
- **An owner stepping down** from owner to member sees the message about lost
  access in place of the People table, not a notification.

## Not checked yet

The notifications have been checked in Chromium, in light and dark, at desktop
and phone widths. They haven't been tried in Firefox or Safari, on a real phone,
or with a screen reader.
