<!-- Outside contributions: typo fixes and docs corrections are welcome.
     For anything larger, open an issue first. See the PR guide at
     docs/contributing/pr-guide.md.
     PR title: Conventional Commits, same as commit subjects, e.g.
     docs(self-hosting): document the REGISTRY_HOST env var change -->

## What and why

<!-- What does this change, and why? If a doc changed because the app
     changed, link the wicker-money PR or commit. -->

## Linked issue

<!-- Closes #123, or "None". -->

## Checklist

- [ ] Commits use Conventional Commits and are signed off (`git commit -s`)
- [ ] `pnpm lint`, `pnpm typecheck` and `pnpm build` pass locally (the build also catches broken links; CI runs the same checks on pull requests)
- [ ] Content describes what's shipped today; planned work is labelled as planned
- [ ] Brand rules hold: "Weave together your future." stays out of feature copy, terminology follows the brand guide
- [ ] Any `--wm-*` change in `src/css/custom.css` still matches `packages/ui-kit/src/tokens.css` in wicker-money
- [ ] Site changes checked in light and dark mode (screenshots below if visual)

## Related PRs

<!-- Matching changes in wicker-money or wicker-money-marketing, or "None". -->
