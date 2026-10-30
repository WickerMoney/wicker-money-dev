---
sidebar_position: 9
description: Who an instance's owner is, what a member can do, and how an owner changes roles from Settings → People.
---

# Owners and members

Every account on an instance is either an **owner** or a **member**.

*Roles took effect in 0.4.0.*

- The **first account** registered on an instance is its owner.
- Every account registered after it is a **member**.
- Members use the app normally, with their own data. Every account's data is
  its own, owner or not. Being an owner doesn't give access to anyone else's
  accounts or transactions. (An owner can erase the whole instance, which
  deletes everyone's data; see [Erasing your data](./erasing-data).)
- Only an owner can administer the instance. That means turning
  [plugins](./plugins) on and off, [changing other people's
  roles](#changing-someones-role), and
  [erasing the whole instance](./erasing-data#erase-this-entire-instance).

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
then, they are all still owners. Open [Settings → People](#changing-someones-role)
and make the ones that shouldn't be owners members.

## Changing someone's role

*Added in 0.6.0. Before that, a role could only be changed with SQL.*

**Settings → People** (`/settings#people`) is for owners; a member never sees
it. It lists every account on the instance, oldest first, with its email, when
it joined and a **Role** select. Nothing else about an account is shown: no
password, no time zone, none of its data.

- **Making someone an owner** takes effect as soon as you choose it. It gives
  them the same control you have: turning plugins on and off, changing roles
  and erasing the instance. This is the only way an instance gets a second
  owner; registration never makes one.
- **Making an owner a member** asks you to confirm first, because it takes
  something away. The dialog says what is lost and what isn't: their data and
  their sign-in are untouched, and an owner can make them an owner again. If it
  is you, it says that only another owner can give your access back.
- **A role change says what it did** in a [notification](./notifications), which
  stays until you close it. Before 0.7.0 a line under the table announced it.
- **An instance always keeps at least one owner.** The last owner can't be made
  a member, and an owner can step down only while another owner remains. If two
  owners step each other down at the same moment, one of the changes wins and
  the other is refused.
- **It applies on that account's next request**, with no sign-out. If you
  demote yourself, or another owner demotes you while the page is open, the
  People section is replaced by a note saying you're now a member.
- Each change is written to the server log at `info`, with who changed whom.

For the endpoints behind it (`GET /api/v1/users` and
`PATCH /api/v1/users/:id/role`), see the
[API reference](../api/overview#users-and-roles).

### Checking and changing roles with SQL

You only need this if you can't use the People screen, for instance because no
owner can sign in. Connect as the database owner (`DATABASE_OWNER_URL`):

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

SQL isn't held to the last-owner rule. If every owner is demoted this way, the
next account to register becomes the owner. That's one more reason to close
registration once the accounts you need exist: set
`REGISTRATION_ENABLED=false` (see the
[Configuration reference](../self-hosting/configuration#auth)).
