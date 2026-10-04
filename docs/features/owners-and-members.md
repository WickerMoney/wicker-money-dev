---
sidebar_position: 8
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
