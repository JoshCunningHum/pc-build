# Architecture

How this app is put together, and the decisions behind it that aren't obvious from reading the
code. Start here before changing anything structural.

**Read [PRODUCT.md](./PRODUCT.md) first** if you don't already know what a "spec" is versus a
"part", what Settings constants are for, or why the Database and Parts sections both exist. This
document assumes that vocabulary and won't re-explain it.

## The two layers, in code terms

The domain distinction ([PRODUCT.md](./PRODUCT.md#the-mental-model-three-layers)) maps onto types
like this:

|                      | Specs catalog                            | Canvassed parts                      |
| -------------------- | ---------------------------------------- | ------------------------------------ |
| Type                 | `Specs.CPU`, `Specs.Motherboard`, …      | `Parts.CPU = Specs.CPU & Parts.Base` |
| Has price/link/image | No                                       | Yes (`Parts.Base`)                   |
| Where                | Database page (`/database`)              | Parts pages (`/parts/*`)             |
| Seeded               | Yes, from [docyx/pc-part-dataset]        | No, user-entered only                |
| Persisted as         | Overrides + tombstones over a seed array | (not built)                          |

`Parts.Base` is `{ image?, title, link, price }`. `Builds.BuildParts` holds `Parts.*`, never
`Specs.*` — a build has to know what it costs.

[docyx/pc-part-dataset]: https://github.com/docyx/pc-part-dataset

## Status

| Area                                      | State                                                            |
| ----------------------------------------- | ---------------------------------------------------------------- |
| Specs catalog data layer                  | Done — `stores/`, `lib/specs-store.ts`, `data/seed/`             |
| Database page: browse, filter, sort       | Done                                                             |
| Database page: add / edit / delete        | Done                                                             |
| Settings: constants + stored data         | Done                                                             |
| **Canvassed parts (`/parts/*`)**          | **Not started** — pages are one-line stubs                       |
| Builds (`/builds`)                        | Not started — stub                                               |
| Build validation engine                   | Written (`lib/rules.ts`) but nothing calls `validateBuild()` yet |
| Comparison (build-vs-build, part-vs-part) | Not started                                                      |

Don't assume something exists because it's in the product vision. Check the table.

## Stack

- **Nuxt 4 + Vue 3**, SPA (`ssr: false`) — static output, not a Node server.
- **@nuxt/ui v4** + **Tailwind v4** (CSS-first config in `app/assets/css/main.css`; there is no
  `tailwind.config.*`).
- **Pinia** for stores, **@vueuse/nuxt**, **nuxt-typed-router**, **zod** for schemas + env.
- **bun** is the package manager (`bun.lock`). Not npm/pnpm/yarn.
- **oxc** for lint and format (`oxlint` + `oxfmt`) — not ESLint/Prettier/Biome.

```
bun install
bun run dev
bun run build
bun run generate      # static output -> .output/public
bun run lint          # oxlint
bun run format        # oxfmt (tabs, single quotes, 100 cols)
```

## Layout (`app/` is Nuxt's srcDir)

```
types/          parts.ts (Specs.* + Parts.*), build.d.ts, rules.d.ts
lib/            specs-store.ts (the store factory), rules.ts (compatibility checks)
stores/         one per category + constants.ts
constants/      parts.ts, part-filters.ts, part-schemas.ts, part-defaults.ts,
                database-columns.tsx, spec-labels.ts, sidebar.ts
composables/    useSettingsDraft.ts
utils/          build-validation.ts, spec-display.ts, constant-entries.ts, clone.ts
components/     PartForm/, PartDialog/, Spec/, Settings/, PartFilters/, Sidebar/
pages/          database.vue, settings.vue, builds.vue, parts/*.vue, index.vue
data/seed/      generated catalog JSON (committed)
```

## Core mechanisms

### `createSpecsStore` — the one store factory

`lib/specs-store.ts` backs all eight category stores. Each merges three things into one reactive
`list`:

1. **seed** — the read-only pre-seeded array, lazily `import()`ed so Vite code-splits each
   category into its own chunk.
2. **overrides** — `useLocalStorage` array. One mechanism covers both "edit a seeded spec" and
   "add a brand new one"; on a `name` collision the override wins.
3. **deleted** — a tombstone list of names, filtered out of `list`.

Everything is keyed by `name`. Consequences worth knowing:

- `remove(name)` tombstones, so seeded specs can be deleted too. `upsert` clears a name's
  tombstone, so re-creating a deleted name brings it back.
- Only tombstoned names that exist in `seed` are restorable — `deletedSeedNames`. A deleted
  user-created spec is simply gone.
- `rename(old, spec)` is `remove(old)` then `upsert(spec)`.

### Category keys don't match filenames

`Builds.PartType` is `cooler | storage | video_card | psu | …`, but the seeds and stores are
`cpu-cooler.json`/`useCpuCoolerStore`, `internal-hard-drive.json`, `video-card.json`,
`power-supply.json`. **`constants/parts.ts` is the single place that resolves this** —
`PART_TYPE_META` (label + icon) and `SPECS_STORES` (the store getter). Anything iterating
categories generically goes through those instead of hardcoding eight branches.

### The constants system

`stores/constants.ts` holds the option lists the add/edit forms offer. Its scope is deliberate:
**only values the build validator and comparator reason about.** Open-ended descriptive fields
(colors, GPU chipsets, storage type/interface/form factor, case side panels) are _not_ constants —
their inputs suggest from the live catalog via `distinctStrings` and accept anything.

Current constants: form factors, efficiency tiers, PCIe, DDR, sockets, microarchitectures,
PSU types.

An entry is `{ label, value, brand? }`. The `label`/`value` split is the crux:

- **Ranked lists** (form factors, efficiency, PCIe, DDR) — `value` is what a spec stores. For
  form factors and efficiency that's the original enum ordinal, so `ATX` is still `2` and no
  stored row ever changed meaning when these became user-editable. The label is display-only;
  renaming one is cosmetic.
- **Label-keyed lists** (sockets, microarchitectures, PSU types) — `value === label`, and the
  label is literally what gets written onto a spec. Renaming therefore carries the value along.

`updateEntry` in `utils/constant-entries.ts` implements exactly that distinction. Get it wrong and
you either orphan stored specs or freeze labels.

**Rank is list position, not `value`.** Reordering form factors genuinely changes which boards fit
which cases, because `lib/rules.ts` compares `rank()`. When a spec holds a value that isn't in the
configured list at all, the rule emits a `*_UNKNOWN` warning rather than silently passing or
failing.

Lists are snapshotted from the catalog on first visit to Settings, once all eight stores have
finished loading (`seedWhenLoaded`). "Reset to catalog defaults" re-snapshots.

### Types widened for user-editable constants

Because constants are extensible, these are **not** literal unions:

```ts
Specs.DDRVersion = string       Specs.FormFactor = number
Specs.PCIeVersion = number      Specs.Efficiency = number
```

`Specs.MotherboardFormFactor` and `Specs.PowerSupplyEfficiency` still exist as enums, but only as
the named source of the _seeded_ ordinals. `constants/part-schemas.ts` validates these five fields
by membership of the configured list, not by a literal union.

### Settings staging

Settings edits go into a **page-scoped draft** (`composables/useSettingsDraft.ts`), not straight
to the store. A footer offers Discard/Save; leaving the page while dirty asks for confirmation
(`onBeforeRouteLeave` returning a promise, plus `beforeunload`).

The draft is page-scoped for a specific reason: `lib/rules.ts`, `constants/part-schemas.ts` and
every `PartForm` read the constants store live. A draft held _inside_ that store would leak
half-finished edits into build validation and every form dropdown before the user saves.

Because of the draft, the constants store has **no mutating actions** — it exposes reads plus
`replaceAll()` and `catalogDefaults()`. Mutation logic lives as pure functions in
`utils/constant-entries.ts`.

### Forms

`components/PartForm/index.vue` owns the `UForm`, the zod schema and the draft `v-model`, then
dispatches on `type` to one component per category (`Cpu.vue`, `Cooler.vue`, …). Each of those is
concretely typed against its own `Specs.*`, so there are no casts inside them. Shared controls
live in `components/Spec/` and auto-import as `<SpecText>`, `<SpecNumber>`, `<SpecCombobox>`,
`<SpecSelect>`, `<SpecMultiSelect>`, `<SpecCheckbox>`, `<SpecRange>`.

The form component is _only_ the form — no buttons. It exposes `validate()` and emits validity so
the wrapping dialog owns Cancel/Save. `PartDialog/` holds the two Database wrappers.

**This is the piece the Parts section should reuse.** A canvassed part is `Specs.X & Parts.Base`,
so a Parts form is this component plus four more fields (`image?`, `title`, `link`, `price`).

## Gotchas

These all cost time at least once.

- **`types/parts.ts` must stay `.ts`, never `.d.ts`.** It exports real runtime enums; a
  declaration file emits no JS and any value import of it fails to bundle. `build.d.ts` and
  `rules.d.ts` are safe as `.d.ts` — no runtime values.
- **`app/data/seed/*.json` is minified on purpose.** Vite's dev-mode JSON transform escapes the
  file into a `JSON.parse` string, where indentation inflates it ~9× (measured on memory.json).
  `.oxfmtrc.json` ignores `app/data/seed/**` so `bun run format` can't undo it.
- **`structuredClone` throws on Vue reactive proxies** (`DataCloneError`). Use `deepClone` from
  `utils/clone.ts` — a JSON round-trip, which also drops `undefined` keys, which is what callers
  want here.
- **`UNavigationMenu`'s `v-model` doesn't select flat items.** In vertical orientation it drives
  Reka UI's accordion expand state. For a flat, non-routed list use `onSelect` plus an explicit
  `active` flag (see `pages/database.vue` and `pages/settings.vue`).
- **`SpecsStore` in `constants/parts.ts` uses method shorthand deliberately.** Bivariant
  parameters are what let each store's concretely-typed `upsert(spec: Specs.CPU)` satisfy the
  union-erased interface.
- **A composable returning refs must be `reactive()`-wrapped** if templates access them as plain
  properties. `useSettingsDraft` does this; without it `v-if="draft.dirty"` reads a `ComputedRef`
  object and is always truthy.
- **There is no type-checker.** No `vue-tsc`; `oxlint`'s TS plugin doesn't do cross-file checking
  and Vite strips types without checking them. A green `bun run build` does not mean the types are
  sound — exercise non-trivial type changes in the running app.
- **`package.json` has a script literally named `"check:"`** with a stray colon. Pre-existing; not
  a typo to silently fix.

## Data and generation

`data/seed/*.json` is generated from `app/imported/*.csv` (the raw docyx export) by
`scripts/dataset/convert.py`. Two deliberate git decisions:

- **`scripts/dataset/` is untracked via `.git/info/exclude`, not `.gitignore`** — it's a
  run-occasionally tool, kept visible in `git status` rather than hidden or committed.
- **`app/imported/` is in `.gitignore`** (11 MB of regenerable input).

The generated `data/seed/*.json` **is** committed. Regenerating requires Python 3.10+ (the system
`python3` on macOS may be too old for the `X | None` syntax the script uses).

Known dataset gap: every seeded cooler has an **empty `sockets` array**, so the socket constant
draws only from the CPU and motherboard catalogs, and the cooler-socket rule never fires on
seeded data.

## Storage keys

| Key                                    | Holds                     |
| -------------------------------------- | ------------------------- |
| `pcbuild:<category>:overrides`         | Edited + user-added specs |
| `pcbuild:<category>:overrides:deleted` | Tombstoned spec names     |
| `pc-build:constants`                   | All constant lists        |

Note the inconsistent prefix — `pcbuild:` for specs, `pc-build:` for constants. Harmless but real;
changing either orphans existing user data, so pick deliberately if you unify them.

## Conventions

- `.oxfmtrc.json`: tabs, single quotes, 100 columns. Run `bun run format` before committing.
- Imports use the `~/` alias (→ `app/`).
- Prefer `import type`; import a type module as a value only for a runtime construct like an enum.
- **Comments are the exception, not the rule.** Write one only when it records something the code
  cannot show: a compiler or runtime trap, why an unsafe cast is sound, or a domain fact (see the
  socket/PCIe tables in `scripts/dataset/lookups/`). Never restate a signature. Survivors are one
  or two lines.
- Commit messages are a single gitmoji-prefixed subject line, no body.

## Deployment

- **Vercel**, serving the static `nuxt generate` output.
- **Docker + nginx** via `just start` — `oven/bun:1-alpine` builds, `nginx:1.27-alpine` serves
  `.output/public` with SPA fallback and immutable `/_nuxt/` caching.

`app/env.ts` + `modules/ensure-env.ts` validate env vars at boot with zod and fail fast. Currently
only `VITE_APP_NAME` is required.
