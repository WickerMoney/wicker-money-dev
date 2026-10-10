---
sidebar_position: 4
description: What the :latest, :edge and version tags on the Wicker Money image mean, and which one to run.
---

# Release tags

Every image lives at `ghcr.io/wickermoney/wicker-money`, built for both
`linux/amd64` and `linux/arm64`. Three kinds of tag point at it. Only the
version tags stay put; the other two move.

| Tag | Points at | Moves when | Use it for |
|---|---|---|---|
| `:0.5.0` (a version) | That exact release | Never | Anything you keep running |
| `:latest` | The newest stable release | A stable tag is released | A first look, or tracking releases on purpose |
| `:edge` | The newest commit on `main` | Every merge to `main` | Trying unreleased work |

## Version tags

A release `v0.5.0` on GitHub is the image tag `:0.5.0`, without the `v`. A
version tag is written once and never rewritten, so a compose file that pins
one pulls the same image every time. This is what the
[quickstart](./quickstart#1-get-an-image) recommends for anything you keep.

There are no floating `:0.4` or `:0` tags. A pre-1.0 minor release can carry a
breaking migration (see [Upgrading](./upgrading)), so there is no tag that
upgrades you across one without you choosing to.

## `:latest`

The newest release that isn't a prerelease. It changes on every stable
release, with no warning in your compose file, and bundled plugins ship inside
the image, so a pull can change which plugin versions you're running.

## Release candidates

A tag with a hyphen, such as `v0.6.0-rc.1`, is a prerelease. It publishes the
version tag `:0.6.0-rc.1` and nothing else: it never touches `:latest`, and the
release is marked as a prerelease on GitHub. To try a candidate, pin that
version tag in your compose file and run it against a copy of your data.

There is no `:next` tag. It used to follow the newest candidate, but after a
stable release it sat on an older candidate than `:latest`, which made it
easy to pull something stale by mistake. It was retired after `0.5.0` and no
longer updates, so don't point anything at it. The npm packages still use a
`next` dist-tag: the stable release goes under `latest` and a prerelease
under `next`.

## `:edge`

Every merge to `main` that passes CI publishes `:edge`, plus
`:edge-<short sha>` for that exact commit. It exists so you can run what's on
`main` without waiting for a tag.

It is not a release:

- **The version says so.** The About page shows `0.0.0-edge.<short sha>`, and
  the image's version label says the same.
- **It can be ahead of the newest release's database.** A migration merged to
  `main` reaches `:edge` immediately, before any version tag has it. Moving
  from `:edge` back to a release image isn't something to rely on: back up
  before every `:edge` pull, and restore that backup to go back.
- **No npm packages and no GitHub release come out of it.** Only the image.
- **It can break.** `main` passes the same lint, typecheck, build and tests as
  a release, but nobody has written release notes for it.

To stay on one build, pin `:edge-<short sha>` instead of `:edge`. The short
sha is the first 7 characters of the commit on GitHub.

## Which should I run?

1. **A version tag.** Repeatable, and you upgrade when you decide to, after
   reading the [changelog](https://github.com/wickermoney/wicker-money/blob/main/CHANGELOG.md).
2. **`:latest`**, if you're happy for a pull to be an upgrade. Fine for a first
   look; for anything long-lived, prefer the version tag.
3. **A release candidate's version tag** (`:0.6.0-rc.1`), to test it on a copy
   of your data before the stable release lands.
4. **`:edge`**, for contributors and anyone who wants a change that has merged
   but isn't released. Keep it away from the only copy of your finances.

## Pinning in compose

The sample compose file uses the same image in two services, `migrate` and
`wickermoney`. Change both, so the migration and the app always run from the
same build:

```yaml
services:
  migrate:
    image: ghcr.io/wickermoney/wicker-money:0.5.0
  wickermoney:
    image: ghcr.io/wickermoney/wicker-money:0.5.0
```

For one exact build of `main`, use `:edge-<short sha>` in both places instead.
Then `docker compose pull && docker compose up -d`; `migrate` runs before the
app, as described under [Upgrading](./upgrading#general-procedure).
