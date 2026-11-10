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
| Has price/link/image | No                                       | Optional (`Parts.Base`)              |
| Where                | Database page (`/database`)              | Parts pages (`/parts/*`)             |
| Seeded               | Yes, from [docyx/pc-part-dataset]        | No, user-entered only                |
| Persisted as         | Overrides + tombstones over a seed array | `localStorage`, one key per category |

`Parts.Base` is `{ image?, title, link?, price? }`. A build does not copy a Parts listing: it
stores `Builds.PartRef = { type, title }` and resolves those refs through `PARTS_STORES` at read
time. That keeps prices and specs live across every build, and makes a build a set of pointers
rather than a third copy of the data. `Builds.ResolvedBuild` is the derived shape the UI uses and
also records refs whose listing no longer exists.

[docyx/pc-part-dataset]: https://github.com/docyx/pc-part-dataset

## Status

| Area                                | State                                                             |
| ----------------------------------- | ----------------------------------------------------------------- |
| Specs catalog data layer            | Done — `stores/`, `lib/specs-store.ts`, `data/seed/`              |
| Database page: browse, filter, sort | Done                                                              |
| Database page: add / edit / delete  | Done                                                              |
| Settings: constants + stored data   | Done                                                              |
| Canvassed parts (`/parts/*`)        | Done — `lib/parts-store.ts`, `stores/parts/`, `components/Parts/` |
| Builds (`/builds`)                  | Done — tabbed workspace, editor, live refs, totals                |
| Build validation engine             | Done — `validateBuild()` runs in the editor and comparison        |
| Comparison (build-vs-build)         | Done — per-section basis, percentages, aggregation                |
| Comparison (part-vs-part)           | Not started                                                       |

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
lib/            specs-store.ts + parts-store.ts (store factories), rules.ts (compatibility checks)
stores/         one per category + constants.ts + parts/ (canvassed listings)
                builds.ts, build-tabs.ts
constants/      parts.ts, part-filters.ts, part-schemas.ts, part-defaults.ts,
                database-columns.tsx, spec-labels.ts, sidebar.ts, build-comparison.ts
composables/    useSettingsDraft.ts
utils/          build-validation.ts, builds.ts, spec-display.ts, constant-entries.ts, clone.ts,
                format.ts
components/     PartForm/, PartDialog/, Parts/, Builds/, Spec/, Settings/, PartFilters/, Sidebar/
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

The Parts pages do not embed `PartForm`. A listing copies the complete spec row chosen from the
Database, and `components/Parts/BaseFields.vue` edits only `Parts.Base` (`image?`, `title`,
`link?`, `price?`). `PART_BASE_SCHEMA` in `constants/part-schemas.ts` validates those fields,
accepting either an image URL or an uploaded data URL for the photo. `link` and `price` are
optional; `utils/parts.ts` derives the **incomplete** flag from their absence rather than storing
it, so filling either field in clears the flag automatically.

Spec names are **not unique** in the seed data — RAM, storage and cases repeat names heavily —
and `SpecsStore.getByName()` only ever resolves the first match. Creation dialogs therefore key
their picker on the whole row (`specKey()` in `utils/spec-display.ts`) and show a descriptor with
the fields that distinguish variants (`specOptionLabel()`), instead of selecting by name. Filters
come from the shared `PART_FILTER_FIELDS` table through `PartFilters`; `exclude` drops the
redundant name box when a picker already has search, and exact numeric `equals` fields expose RAM
module count and module size. The same filter bar sits above the spec picker in both listing
creation (`Parts/AddDialog.vue`) and spec creation (`PartDialog/CreatePartDialog.vue`), and the
Database page can open the listing dialog directly for the selected category.

### Canvassed parts

`lib/parts-store.ts` mirrors the specs factory, but parts have no seed, overrides or tombstones:
they are user-only and `title` is the identity within a category. Eight stores live under
`stores/parts/` and are registered through `PARTS_STORES` in `constants/parts.ts`, the counterpart
to `SPECS_STORES`.

A listing stores a full `Parts.X` — a deep copy of the Database spec plus `Parts.Base` — rather than
a reference by spec name. Editing or deleting a spec therefore does not rewrite or invalidate
listings already recorded; the listing keeps the values it was created with. Adding, editing and
deleting all live in `components/Parts/`; the eight `pages/parts/*.vue` files just render
`PartsListingPage` with their category. Missing prices or links are derived into an incomplete
badge in the table, and `constants/sidebar.ts` exposes `sidebarItems()` so each Parts category can
show a live listing count built through `PARTS_STORES`.

### Builds are live references

`stores/builds.ts` persists `Builds.Build[]` under `pcbuild:builds`. A build holds no part data —
only `PartRef { type, title }` pointers, with `memory` and `storage` holding arrays and the other
six categories holding at most one ref. `resolveBuild()` in `utils/builds.ts` dereferences them
through `PARTS_STORES[type]().getByTitle(title)` into a `ResolvedBuild`, collecting any ref whose
listing is gone into `missing`. Every consumer (editor, list, comparison) works on the resolved
shape, so a price or spec edit in Parts shows up in every build immediately with no sync step.

Points that follow from that design:

- **Rename has to be pushed.** Parts identity is `title`, so `Parts/EditDialog.vue` calls
  `buildsStore.renamePartReference()` after a rename. A deleted listing is not rewritten: the ref is
  left in place and `resolveBuild()` reports it as missing until the user replaces it.
- **Delete warns, doesn't cascade.** `Parts/ListingPage.vue` uses `countPartReferences()` to say how
  many builds will show the listing as missing before confirming.
- **Totals exclude missing refs.** `buildTotalPrice()` sums only resolved parts; missing refs are
  counted separately by `buildMissingCount()`. Incomplete parts (no price/link) still resolve and
  contribute their price.
- **Build names are the identity.** There is no id; renaming a build rewrites the name and every tab
  that points at it (`tabs.renameBuild()`).

### The Builds workspace is page-local tab state

`stores/build-tabs.ts` persists `{ tabs, activeId }` under `pcbuild:build-tabs`. Tabs are **not**
routes — they exist only while `/builds` is mounted, and `pages/builds.vue` is a one-line shell
around `BuildsWorkspace`.

- Four tab kinds: the unclosable `builds` list, `create`, `build` (by name), and `compare` (by a set
  of names). The compare tab's id is random; existing comparisons are matched by their name set so
  reopening the same selection focuses the existing tab.
- `Workspace.vue` keeps dirty flags per tab. A dirty tab shows a dot, closing it opens a confirm,
  and `onBeforeRouteLeave` + `beforeunload` guard navigation. Because inactive tabs use `v-show`,
  editors stay mounted and their drafts survive switching tabs.
- Editing a build in place keeps the `create` → `build` conversion in `convertCreateToBuild()`,
  which rewrites the tab's id/kind rather than closing and reopening it.
- `syncBuilds()` drops tabs for builds that no longer exist, so deleting a build closes its tab and
  removes it from open comparisons.

### The build page is a diagram plus a rail

`Builds/Editor.vue` composes three pieces rather than rendering a form:

- `BuildLayout.vue` fills the pane with the machine: the solid outer frame is the case, the dashed
  inset is the motherboard, the dashed ring around the CPU is the cooler, and GPU, PSU, RAM and
  storage sit in fixed percentage slots inside. Because every
  region is percentage-based, the case stretches to whatever space the editor gives it instead of
  being a fixed drawing. The percentage bounds live in a single `LAYOUT` constant inside the
  component, so re-proportioning the machine is a data change rather than a markup change. RAM
  renders one stick per memory module and storage one bar per drive, so the diagram scales with
  multi-listing categories. Empty required slots stay visible as dashed placeholders, and missing
  listings are labelled in place. The component only emits `hover`/`activate`; it owns no editing
  UI. A `mini` prop drops labels and interaction for the list/card variant.
- `PartTooltip.vue` shows the hovered category's resolved listings, spec chips, price, incomplete
  and missing-listing warnings. It is read-only and `pointer-events: none`.
- `Sidebar.vue` is the editing surface: total, per-category subtotals, edit/remove per listing, and
  a problems list (validation issues, missing listings, incomplete parts, empty required
  categories). The diagram's click handler opens the same part picker.
- `PartPickerDialog.vue` runs the build rules against a preview build for every row, so a listing
  that would conflict is badged **Incompatible** (or **Warning**) with the rule messages in a
  tooltip. Rows stay selectable: the picker informs before the choice, it does not block it.

Hover state and pointer position live in `Editor.vue`; the tooltip is positioned relative to the
layout section and clamped inside it. In comparison mode the layout stays mounted and only the rail
is swapped, so the hover tooltip changes from part details to `CompareTooltip.vue`.

### Comparison

`constants/build-comparison.ts` defines `COMPARE_SECTIONS` — one summary section plus one per part
category. Each section declares `hasPart()` and an ordered list of `CompareRow`s. A row supplies a
display `value()` and, for numeric comparisons, either an implicit number or an explicit
`numeric()` (ranges compare by their upper bound). Row `kind` is `percent`, `label` (ordinal, e.g.
PSU efficiency) or `none` (descriptive, uncoloured).

- **`CompareTable.vue` is the only table implementation.** It owns the header (build names, and
  totals/badges when not `compact`), every section, and the percentage lines, so header and body
  columns cannot drift apart. `Comparison.vue` embeds it; `CompareTooltip.vue` reuses it in
  compact, read-only form for a single section.
- **Basis is per section.** `baselineForSection()` resolves the stored name to the first eligible
  build when unset. Clicking a value cell sets that build as the section's basis. Every cell in the
  basis column gets a dark-green tint; the tint alone marks the basis, with no text label. The
  percentage line inside that cell stays blank. `Editor.vue` owns the baseline record so the
  layout tooltip and the rail share it; `Comparison.vue` keeps a synchronised local copy so
  standalone compare tabs still work without a parent binding.
- **Percentage is raw, signed difference** from the basis (`(value - basis) / basis * 100`), not a
  percentage-point or ratio change. `compareTone()` colours it using `row.direction`: `higher` is
  green above the basis, `lower` is green below it, so a cheaper part reads as a green negative.
  Differences under 0.05% render as `0%`/neutral. Numeric rows render the value and the delta in the
  same cell as stacked lines, avoiding a second row of mostly blank cells across the table.
- **Tab cycles the hovered basis.** `Editor.vue` uses `defineShortcuts()` with a reactive config:
  while comparison mode is on and the hovered section has at least two builds, `Tab` and `Shift+Tab`
  move the baseline forward/backwards; otherwise the shortcuts are disabled so normal focus
  navigation is untouched. `CompareTooltip.vue` shows the matching hint in its footer.
- **Ordinal rows are coloured, not measured.** `label` rows use each build's `order()` rank and the
  same `direction`, but display no percentage, because a percentage of an ordinal is meaningless.
- **Memory and storage aggregate**, since a build can hold several listings: capacity/modules/cache
  are summed; speed and latency use the worst kit; descriptive fields collapse to `Mixed`.
- `Comparison.vue` is reused in two places: a standalone `compare` tab and the build tab's rail
  (`embedded`). In the editor the layout stays mounted and only the rail switches to comparison, so
  **Back to build** restores unsaved state untouched. Hovering a layout region in that mode shows
  the same table for that section, restricted to builds that have the part.

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
- **Build refs are keyed by title, not id.** Renaming a Parts listing must go through
  `renamePartReference()` or every build silently shows the listing as missing. The same applies to
  any future part-editing path that changes `title`.
- **`Builds.BuildParts` is only partially optional.** `memory` and `storage` are required arrays on
  the type even though a build can leave them empty; code that reads a build from storage should
  still treat them as possibly absent (`?? []`) because old or hand-edited data may not have them.
- **Build tabs are not routes.** A deep link only opens `/builds`; the tab layout comes from
  `localStorage`. Anything that navigates away and back relies on `syncBuilds()` pruning tabs for
  deleted builds, not on the router restoring them.
- **The build editor keeps the layout mounted during comparison.** Comparison swaps only the right
  rail (`v-if` on the rail contents), not the editor body. Unmounting the layout or the editor would
  discard the user's unsaved draft and make **Back to build** lossy.
- **Hover tooltips are read-only on purpose.** They use `pointer-events: none` so a following
  cursor cannot flicker in and out of the tooltip. Editing belongs in the rail and the picker;
  don't add buttons to a tooltip.
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

| Key                                    | Holds                           |
| -------------------------------------- | ------------------------------- |
| `pcbuild:<category>:overrides`         | Edited + user-added specs       |
| `pcbuild:<category>:overrides:deleted` | Tombstoned spec names           |
| `pcbuild:parts:<category>`             | Canvassed listings per category |
| `pcbuild:builds`                       | Saved builds (live refs)        |
| `pcbuild:build-tabs`                   | Open Builds workspace tabs      |
| `pc-build:constants`                   | All constant lists              |

Note the inconsistent prefix — `pcbuild:` for specs and parts, `pc-build:` for constants. Harmless
but real; changing either orphans existing user data, so pick deliberately if you unify them.

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
