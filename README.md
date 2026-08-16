# pc-build

A frontend-only PC build planner built around canvassing parts — especially secondhand ones.

Every part you record carries an image, a source link and a price, because the workflow it's built
for is "find this part somewhere, note what it costs, add it to a build". There's no backend:
everything lives in `localStorage` and the app deploys as a static site.

## What it does

- **Specs catalog** — a reference database of components (CPUs, motherboards, memory, GPUs, cases,
  PSUs, coolers, storage), pre-seeded from [docyx/pc-part-dataset]. Browse, filter and sort it,
  override a seeded spec, or add your own.
- **Settings** — curate the option lists the forms offer, and recover specs you deleted.
- **Canvassed parts, builds, and comparison** — planned, not built yet.

[PRODUCT.md](./PRODUCT.md) explains what the app is for, how the pieces fit together, and what
each page does — including the distinction between a _spec_ in the Database and a _part_ you
canvassed. [ARCHITECTURE.md](./ARCHITECTURE.md) covers how it's built and what already exists.

[docyx/pc-part-dataset]: https://github.com/docyx/pc-part-dataset

## Getting started

Requires [bun](https://bun.sh). Other package managers are not supported — `bun.lock` is the
lockfile.

```bash
bun install
bun run dev          # http://localhost:3000
```

A `VITE_APP_NAME` env var is required; the app validates env at boot and exits early if it's
missing.

```bash
echo 'VITE_APP_NAME=pc-build' > .env
```

## Commands

```bash
bun run dev          # dev server
bun run build        # Nuxt build
bun run generate     # static output -> .output/public
bun run preview

bun run lint         # oxlint
bun run lint:fix
bun run format       # oxfmt
bun run format:check
```

Lint and format use the [oxc](https://oxc.rs) toolchain, not ESLint/Prettier. Config is in
`oxlint.config.ts` and `.oxfmtrc.json`.

There is no type-checker in this repo — a passing build does not verify types.

## Stack

Nuxt 4 · Vue 3 (SPA, `ssr: false`) · @nuxt/ui v4 · Tailwind v4 · Pinia · zod

## Deployment

Vercel serves the static `nuxt generate` output. A self-hosted path exists too — `just start`
builds with bun and serves `.output/public` from nginx.

## Docs

| File                                 | Covers                                                   |
| ------------------------------------ | -------------------------------------------------------- |
| [PRODUCT.md](./PRODUCT.md)           | Purpose, the spec/part/build model, what every page does |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Code layout, the shared store factory, gotchas           |

Read PRODUCT.md before ARCHITECTURE.md — the code only makes sense once the domain does.
