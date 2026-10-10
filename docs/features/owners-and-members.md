---
sidebar_position: 9
description: Who an instance's owner is, what a member can do, and how to check and change roles.
---

# Owners and members

Every account on an instance is either an **owner** or a **member**.

*Roles took effect in 0.4.0.*

- The **first account** registered on an instance is its owner.
- Every account registered after it is a **member**.
- Members use the app normally, with their own data. Every account's data is
  its own, owner or not. Being an owner doesn't give access to anyone else's
  accounts or transactions.
- Only an owner can administer the instance. Today that means turning
  [plugins](./plugins) on and off.

The server checks the role on every owner-only request, so a role change takes
effect on that person's next request, with no sign-out. Two people signing up
at the same moment on a new instance can't both become the owner.

## Choosing who the owner is

*Added in 0.5.0.*

By default the first account to register is the owner, so on a server other
people can reach, whoever gets there first owns it. Set
`BOOTSTRAP_OWNER_EMAIL` to your address before the first start and the owner
is the account registered with that address (compared without regard to
case), even if other people registered before it. Everyone else is a member.

- It never creates a second owner. If an owner already exists, the address
  registers as a member; promote it with the SQL below.
- It never changes existing accounts.
- If someone else registers first, they are a member and the instance has no
  owner until the configured address registers.
- Email addresses aren't verified, so anyone who knows the address could
  register it before you do. The setting keeps strangers from claiming a
  fresh instance by accident; it isn't a login check. Register your own
  account promptly, then set `REGISTRATION_ENABLED=false`.
- `REGISTRATION_ENABLED=false` still takes precedence: with registration
  closed, nobody can register, that address included.

With the setting unset, a production start-up on an empty instance with
registration open logs a warning. See the
[Configuration reference](../self-hosting/configuration#auth).

## Instances from before 0.4.0

Before 0.4.0, every account was registered as an owner, and upgrading doesn't
change existing accounts. If several people signed up on your instance before
then, they are all still owners. Check, and demote the ones that shouldn't be.

## Checking and changing roles

There's no screen for this yet; it's on the
[roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md).
Until then, connect as the database owner (`DATABASE_OWNER_URL`) and use SQL:

```sql
-- who is an owner
SELECT email, role, created_at FROM core.users ORDER BY created_at;

-- demote one account (or set 'owner' to promote)
UPDATE core.users SET role = 'member' WHERE email = 'someone@example.com';

-- keep only the earliest account as owner
UPDATE core.users SET role = 'member'
WHERE role = 'owner'
  AND id <> (SELECT id FROM core.users ORDER BY created_at, id LIMIT 1);
```

If every owner is demoted, the next account to register becomes the owner.
That's one more reason to close registration once the accounts you need
exist: set `REGISTRATION_ENABLED=false` (see the
[Configuration reference](../self-hosting/configuration#auth)).
