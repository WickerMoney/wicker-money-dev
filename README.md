# wickermoney.dev

The Wicker Money dev-docs site: self-hosting, contributing and (eventually)
API reference. Built with [Docusaurus 3](https://docusaurus.io/), deployed to
GitHub Pages at the apex domain `wickermoney.dev`.

Product marketing lives in a separate repo, `wicker-money-marketing` — this
one is developer/operator-facing only, no blog.

## Why Docusaurus (not VitePress)

The generator default for a new docs site here is VitePress (TS-native,
lighter, simpler config) — see `documents/hosting-strategy-notes.md` in the
workspace root. That default has an explicit exception: "unless versioned SDK
docs become a near-term need." Wicker Money's plugin model means per-plugin
(and per-`SDK_MAJOR_VERSION`) versioned docs are exactly that — Docusaurus's
built-in version dropdown/history handles it natively, where VitePress would
mean hand-rolling separate folders or deploys per version. It also shares
React with the app itself (`apps/web`), for whatever component/MDX reuse ends
up being worth it later.

If that versioning need never actually materializes, this was still a
reasonable, well-supported choice — just not the *lightest* one available.

## Local development

Requires Node 22+ and pnpm 10 (`corepack enable pnpm`, or `npx pnpm@10.33.0`).

```bash
pnpm install
pnpm start        # dev server at localhost:3000
```

| Command | What it does |
|---|---|
| `pnpm start` | Local dev server with hot reload |
| `pnpm build` | Static build to `build/` |
| `pnpm typecheck` | `tsc` (config, sidebars, MDX) |
| `pnpm lint` | ESLint |
| `pnpm serve` | Serve a production build locally |
| `pnpm clear` | Clear the Docusaurus cache (`.docusaurus/`) |

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages
(`actions/deploy-pages`) on every push to `main`. The custom domain is
configured via `static/CNAME` (copied into the build output automatically) —
DNS itself (4 A records + optional AAAA at the apex, pointed at GitHub's Pages
IPs) is set at the registrar, not in this repo.

## Content structure

```
docs/
├── intro.md
├── self-hosting/     quickstart, configuration reference, upgrading, release tags
├── contributing/      dev environment, architecture, conventions, PRs
└── api/               reference (hand-maintained stub until an OpenAPI
                        spec exists to generate it from)
```

Brand assets (`static/img/`) are copied from the workspace's
`documents/images/`, not re-derived — if the source logo/favicon files change,
re-copy rather than edit these in place.
