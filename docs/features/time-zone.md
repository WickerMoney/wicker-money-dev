---
sidebar_position: 4
description: Why your account has a time zone, what it changes, and how to set it.
---

# Time zone

Your account has a time zone, and it decides when **today** turns over. That
matters for anything dated: the next due date of a recurring item, the
[Until payday](./until-payday) window, and the first day of a
[Forecast](./forecast).

*Setting added in 0.2.1.*

## Why the server decides "today"

"Today" is your calendar day in your account's time zone, worked out on the
server and returned with every response that depends on it. The browser clock
isn't trusted. That way the Recurring page, the widget, the forecast and any
plugin all agree on the date, even when two of them are open in different
places.

## Setting it

- **At sign-up**, a new account takes your browser's time zone. If the browser
  reports a zone the server doesn't recognise, the account starts on `UTC`.
  Sign-up never fails because of it.
- **In Settings → Time zone**, pick any zone. If it differs from your browser's
  zone, the section offers a one-click **Use &lt;your browser's zone&gt;**.

Zones are IANA names, such as `America/New_York` or `Europe/London`. They're
matched case-insensitively and stored in their canonical spelling, so
`us/eastern` is saved as `America/New_York`. Fixed offsets such as `+01:00`
are refused: they have no daylight saving time, and PostgreSQL reads their sign
the opposite way, so a stored offset would be wrong half the year or worse.

## Accounts created before 0.2.1

Accounts created before 0.2.1 are on `UTC`, because there was no way to set
the zone yet. West of UTC, "today" turns over in the evening (8pm in New York
in summer), so a bill due tomorrow shows as due today. Open **Settings → Time
zone** once after upgrading and use your browser's zone.

## From the API

`GET /api/v1/auth/me` returns the zone, and
`PATCH /api/v1/auth/me` with `{ "timezone": "America/New_York" }` changes it.
An unknown zone answers `400 validation_failed`. See
[API reference](../api/overview#authentication).
