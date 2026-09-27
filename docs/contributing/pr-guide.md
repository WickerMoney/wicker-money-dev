---
sidebar_position: 4
description: What's currently being accepted, how to sign commits, and how contribution licensing works.
---

# Pull requests

Wicker Money is pre-1.0 with a single maintainer, so a few honest
expectations up front: review may be slow, some ideas get a "not now," and
things may change under you.

## What's actually being accepted right now

**Issues and suggestions, yes. Feature pull requests, not yet.** The plugin
contract isn't frozen and third-party plugin install isn't supported, so most
outside feature code would need reworking once the contract settles. Typo
fixes, docs corrections and small, focused bug fixes are welcome as PRs today.
This changes once the plugin contract is stable and versioned
(`SDK_MAJOR_VERSION` freezing ahead of 1.0 is on the
[roadmap](https://github.com/wickermoney/wicker-money/blob/main/ROADMAP.md)).

Open an issue before working on anything larger than a small fix — it saves
both sides a PR that doesn't end up fitting. For vulnerabilities, don't open a
public issue; use the security reporting process instead.

## Before you submit

- Keep the PR small and focused on one change.
- Add or update tests for behavior changes. Anything touching data isolation
  runs against a real PostgreSQL (`pnpm test:integration`), not a mock.
- `pnpm lint`, `pnpm typecheck` and `pnpm test` must pass.
- No unrelated reformatting mixed into a functional change.
- Update docs if behavior changes — including this site, if it's a
  self-hosting or contributing change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit
  subjects.

## Sign your commits (DCO)

This project uses the
[Developer Certificate of Origin](https://developercertificate.org/) instead
of a CLA:

```bash
git commit -s
```

That adds a `Signed-off-by: Your Name <you@example.com>` trailer — a
statement that you wrote the change or otherwise have the right to submit it
under the project's license. It's not a copyright transfer and doesn't grant
relicensing rights over your contribution. Missing a sign-off on an existing
commit: `git commit --amend -s` (or `git rebase --signoff` for several),
then push.

## Licensing (inbound = outbound)

A contribution is licensed under the license of the component it changes:

- `plugin-sdk` or `ui-kit` → Apache-2.0
- The app or a bundled plugin → AGPL-3.0-only

See [Architecture → Licensing boundary](./architecture#licensing-boundary)
for why the split exists.

## Code of Conduct

Participation is governed by the project's Code of Conduct, linked from the
repo.
