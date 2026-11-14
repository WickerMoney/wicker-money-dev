---
sidebar_position: 14
description: Importing bank and card statements from CSV, with a saved column mapping per source, a date-format preview, a file sent to the server while you map, duplicate detection and batch undo.
---

# CSV import

**Import** (in the sidebar, from the bundled plugin `wickermoney.import-csv`)
brings a bank or card statement in as transactions. You choose the account and
the file, tell it which column is which, look at what it made of your choices, and
only then does anything get written. The mapping is remembered, so the second
import from the same bank needs no setup, and any import can be undone.

*Added in 0.1.0. Since 0.8.0 the page runs in a sandboxed frame and sends the
file to the server in pieces while you map the columns (see [Sending the
file](#sending-the-file)).*

## The four steps

### 1. File and account

Pick the account under **Import into** and choose a `.csv` file. An import always
lands in one account; archived accounts aren't offered. A file with no header row
is refused: export it again with column names.

The file is read in your browser, so you see a preview of what each column would
become before anything is checked. Its text is read as UTF-8. Since 0.8.0 the
file is also sent to the server at once, while you set the columns, so that the
check in step 3 does not have to send it all again (see [Sending the
file](#sending-the-file)). Nothing is written until step 3 ends with your
decision.

What the reader copes with:

- **Delimiters**: comma, semicolon, tab or pipe, chosen from the header row.
- **Quoted cells** with commas, line breaks or doubled quotes inside, CRLF or LF
  line endings, and the byte-order mark Excel adds.
- **Ragged rows**: short rows are padded and long rows trimmed to the header's
  width, rather than refusing the file.

### 2. Columns and formats

| Setting | What it does |
|---|---|
| **Date** and **Description** | Required. Which column holds the date and the merchant text |
| **Date format** | How every date in the file is written. Choose from `MM/DD/YYYY`, `DD/MM/YYYY`, `YYYY-MM-DD`, `MM-DD-YYYY`, `DD-MM-YYYY`, `DD.MM.YYYY` and `YYYY/MM/DD` |
| **Amount columns** | **One signed amount column**, or **separate debit and credit columns** |
| **Amount**, or **Debit (money out)** and **Credit (money in)** | The column or columns holding money |
| **Notes** | Optional. A memo or reference column |
| **Transaction ID** | Optional. The bank's own id for each transaction (see [Duplicates](#duplicates)) |
| **Remember as** | A name for this layout, such as "Chase Checking". Starts as the file's name |
| **Flip every sign** | For files that show spending as a positive number |

The page suggests columns from the header names, and always shows them in
dropdowns for you to confirm.

**The date format is never guessed from the data.** `03/04/2026` is a valid date
under two formats and means different months in each. The picker starts at
`MM/DD/YYYY` if your browser's language is US English and `DD/MM/YYYY` otherwise,
and the preview table under it shows the first eight readable rows as they will be
saved. Change the format and the table changes at once, so a wrong choice is plain
before you commit. A two-digit year is read as 20xx, a time after the date is
ignored, and a date that doesn't exist (31/02) is an error, not a rollover to
March.

**Amounts** can have thousands separators, a currency symbol, parentheses or a
trailing minus for negatives, and a European decimal comma (a lone comma counts as
decimal only when one or two digits follow it, so `1,234` is one thousand two
hundred thirty-four). More than four decimal places is an error. With separate
columns, exactly one of **Debit** and **Credit** must be filled on a row.
Money out is negative, matching the rest of the app.

A row that can't be read, whether for a missing or impossible date, an empty
description or an amount that isn't money, is **skipped, not guessed at**. A
banner above the preview says how many and gives the first reason.

### 3. Review

Press **Check for duplicates**. Nothing is written yet. The page shows counts for
the whole file:

| Count | Meaning |
|---|---|
| **New** | Will be imported |
| **Already imported** | An exact match on the bank's transaction id, or an id repeated in the file. Skipped, with no decision for you |
| **Needs review** | Looks like a transaction you already have. Listed below, not imported unless you tick it |
| **Unreadable** | Rows that couldn't be mapped (shown only when there are some) |

Under **Possible duplicates**, each flagged row is listed beside the transaction it
resembles. Tick **Import** on the ones that really are new. The list is shown a
page at a time, and **Show *N* more** asks for the next page. Rows you haven't
ticked aren't imported, whether or not they are on screen.

The button says exactly what will happen: **Import *N* transactions**, where *N*
is the new rows plus those you ticked.

### 4. Imported

A line tells you what was written: how many were imported, how many were already
present, how many possible duplicates the file contained and how many rows were
unreadable. **Import another file** starts over.

## Sending the file

*Added in 0.8.0.* The Import page runs in a sandboxed frame, like the other
bundled plugins (see [Plugins](./plugins#how-much-a-plugin-is-trusted)). It
looks and works the same as before, with these differences you can notice:

- **The file goes to the server as soon as you choose it.** The page cuts the file
  into pieces of about 200,000 characters and sends them while you set the
  columns. Under the file name it says "Sending your file to the server. You can
  set the columns meanwhile." with a progress bar, then "Your file is on the
  server." By the time you press **Check for duplicates** it has usually arrived.
  The check, each **Show *N* more** and the import then name the file on the server
  and do not send it again. Small files go the same way.
- **Messages sit in the step they belong to.** A problem with sending the file
  appears at the top of step 1 and scrolls into view if it is off screen. The
  page doesn't use the app's notifications, because a plugin in a frame has none.
- **A table wider than the window scrolls on its own.** On a phone, the column
  mapping, the review list and the recent imports each scroll sideways inside
  their own area, which the keyboard can reach, instead of the whole page
  growing wider than the screen. Rows in **Recent imports** that you have undone
  are muted but still readable.

When sending goes wrong, the file stays in your browser, so you never have to pick
it again unless the page says so:

- **A piece fails.** The page sends it again, twice at most, and says nothing
  unless it keeps failing. Then step 1 shows an alert that starts "Your file could
  not be sent to the server" and gives the reason. The half-sent upload is handed
  back, and **Check for duplicates** sends the file again.
- **The file is refused.** Choosing a file over 8 MB shows "That file is
  larger than 8 MB. Split it and import in parts." and nothing is sent. A file
  that would need more than 64 pieces (only text with unusual characters can)
  shows "That file cannot be sent in the
  pieces the server accepts. Split it and import in parts." When the server holds
  as much staged text as it allows, step 1 says "Other uploads are using all the
  space for staged files right now. Try again in about 30 seconds."
- **The upload expired.** The server keeps a file for 15 minutes after its last new
  piece, and checking doesn't extend that, so a long pause on the mapping step
  can outlast it, and so can an API restart. When you press **Check for
  duplicates**, **Show *N* more** or **Import** and the server no longer has the
  file, the page sends it again once and carries on. If that doesn't help it says
  "The server no longer has your file, and sending it again did not help. Choose
  the file again." beside the button and keeps your mapping.
- **The answer to an import is lost.** If the connection drops after the import
  went through, the page shows the network message (for example "Could not reach
  Wicker Money.") beside **Import** and stays on the review. Press **Import**
  again: the second request carries the same key, gets the first answer, and
  nothing is imported twice.
- **You choose another file.** The first upload is cancelled and handed back to the
  server at once, so it doesn't count against your limit (below).
- **You leave the page.** Going to another page of the app after choosing a file
  and before importing it **does not hand the upload back**: the app removes the
  frame before the page can say so. The server keeps the file until 15 minutes
  after its last new piece. This is a known gap. While two uploads are waiting you can't start
  a third: choosing a file shows "You already have 2 uploads waiting. Import or
  wait for one to expire, then try again." Wait for the older one to expire.

The pieces wait in the memory of the API process, not in the database. See
[Staged upload](../api/overview#staged-upload) for the routes.

## Duplicates

There are two mechanisms, and the difference between them is the point.

- **With a transaction ID column**, a match is a fact. A row whose id is already
  in that account, or that repeats an earlier id in the same file, is skipped
  without asking. Two coffees bought the same day with different ids aren't
  flagged against each other. The database enforces this too: a row that lost a
  race to another import with the same id is counted as skipped, not as a failure.
- **Without one**, all that's left is a guess. A row is flagged for review when an
  existing transaction in the same account has the **same amount**, a date within
  **one day**, and a **similar description**. Descriptions are compared ignoring
  case and punctuation, and count as similar if they're equal or one is the start
  of the other (the shorter at least six characters), so `AMAZON MKTPL` matches
  `AMAZON MKTPL 4XJ22`. Only transactions already in the account are compared:
  two identical rows inside one file, with no ids, are not flagged against each
  other.

A guess has to be a question, because two identical coffees on one day look the
same as one coffee imported twice. Dropping the second silently would lose a real
transaction.

If your bank gives you an id column, map it: it makes re-importing an overlapping
statement safe and quiet. Both checks look at the account's transactions from two
days before the file's earliest date to two days after its latest. An id that
matches something older is still caught, by the database, when you commit.

## Remembered mappings

When you import, the mapping is saved under the name in **Remember as**. A name
you reuse replaces the old mapping, ignoring case. Pick a file later and the page
looks for a saved mapping whose columns all appear in the file's headers (ignoring
case), applies the first that does, and says "Using your saved mapping for
*Name*". It matches on the columns, not the file name, since banks name exports
`activity (3).csv`. Everything it filled in is still in the dropdowns to change.

## Categories and rules

Imported transactions are filed by your
[rules](./categories-and-rules#rules) as they are written, using the same rule
order as everywhere else. A transaction no rule matches comes in uncategorized, and
you work through those on the Transactions page with **Only uncategorized**.
Rows filed this way carry the **rule** tag on the Transactions page.

An import never creates a [transfer](./transfers). A card payment shows on both
statements as two ordinary transactions. See
[A transfer that isn't recorded as a pair](./transfers#a-transfer-that-isnt-recorded-as-a-pair).

## Undoing an import

**Recent imports** at the bottom of the page lists the 25 latest, each with the
account, the source, the file name and the counts. **Undo** removes what that
import created. It uses a record of exactly which transactions the batch wrote, so
a transaction you entered by hand that looks the same is safe.

Undo keeps a transaction you've changed since the import, and tells you how many.
Changed means you edited it, split it, set its category by hand, or turned it into
a transfer. A category a rule set on import doesn't count as a change. An import
can be undone once.

## Limits

- **8 MB and 100,000 rows.** The file can't be larger than 8 MB. A file with more
  than `IMPORT_MAX_ROWS` data rows, counting rows that can't be read, is refused
  with a message that names the limit, before anything is written. Split the file
  and import it in parts. The default of 100,000 is measured, with the reasoning,
  on the [configuration page](../self-hosting/configuration#pool-statement-timeouts-and-the-import-limit).
  An import runs under `DB_LONG_STATEMENT_TIMEOUT`, not the usual 30 seconds.
- **Files waiting on the server.** *Added in 0.8.0.* Each person can have 2 files
  on the server at once, waiting to be imported. A file is gone 15 minutes after
  its last new piece, or as soon as its import succeeds. A file is sent in at
  most 64 pieces, and one API process holds at most 64,000,000 bytes of waiting
  files for everyone together; when it is full a new file is refused until
  space is freed by an import, a cancelled upload or an expiry. The limits are fixed in the code, not settings. See
  [Sending the file](#sending-the-file) for what the page says at each.
- **One import into an account at a time.** Imports into the same account take
  turns, so the second sees what the first wrote. Imports into other accounts, by
  you or by other people on the instance, run alongside, each holding a database
  connection for its commit.
- **A few imports at a time across the instance.** *Added in 0.7.0.* One API
  process commits at most `IMPORT_MAX_CONCURRENT` imports at once (by default,
  half of its database pool). Another commit waits its turn without holding a
  connection, so the rest of the app keeps working while large files are
  imported. If it hasn't had its turn after `IMPORT_QUEUE_WAIT_SECONDS` (30 by
  default), the page says that other imports are running and that nothing was
  imported, and keeps your review. Wait the number of seconds it gives and press
  the button again: the second attempt imports the file once. One person
  importing alone never waits. See
  [Concurrent imports](../self-hosting/configuration#concurrent-imports).
- **A request limit.** *Added in 0.7.0.* Each person may make 30 import requests
  a minute (an analysis, or one more page of rows to review, counts as one;
  so does a commit, and so does starting to send a file, once per file). Past that the page shows the message and says how many
  seconds to wait. See
  [API rate limit](../self-hosting/configuration#api-rate-limit).
- **One commit is one batch.** Everything is written in a single transaction, or
  nothing is. A repeat of the same request, such as a double click or a retry
  after a network error, writes nothing the second time.
- **CSV only.** There is no OFX, QIF or PDF reader, and no connection to a bank.
- **UTF-8.** The file is read as UTF-8, so a file in another encoding may show
  garbled descriptions.

For the endpoints, see [API reference](../api/overview#import-csv). Turning the
plugin off keeps your saved mappings and import history ([Plugins](./plugins)).
