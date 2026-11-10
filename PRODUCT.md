# Product

What this app is for, how it's meant to be used, and what each part of it does. Read this before
[ARCHITECTURE.md](./ARCHITECTURE.md) — the code only makes sense once the domain does.

## The problem it solves

Planning a PC build is easy when you're buying new: every retailer lists the same parts at
comparable prices, and any online configurator will do.

It falls apart when you're **canvassing** — trawling marketplaces, local sellers and secondhand
listings. Now the same CPU appears five times at five prices, from five sellers, with five links
and five photos, and none of that exists in any configurator's database. You end up with a
spreadsheet of listings and a separate mental model of what actually fits together.

This app is for that. It keeps the _reference knowledge_ about parts separate from the _listings
you personally found_, and then checks that whatever you assemble is compatible.

## The mental model: three layers

Almost every confusion in this codebase comes from conflating the first two. They are different.

```
   SPEC                      PART                        BUILD
   "what a component is"     "one I found, for sale"     "a machine I'm planning"

   Ryzen 5 5600              Ryzen 5 5600                cpu:         (a Part)
   AM4, 6 cores,      ──▶    ₱4,200                ──▶   motherboard: (a Part)
   65W, Zen 3                fb.com/marketplace/…        memory:      (Parts)
                             photo.jpg                   …
   no price                  + all the spec data         + validation
```

### Layer 1 — Specs (the Database)

A **spec** is the objective, seller-independent truth about a component: socket, core count, TDP,
form factor, wattage. It has **no price, no link, no image**, because those aren't properties of
an i5-12400F — they're properties of someone's listing.

Specs are pre-seeded from a public dataset so you're not typing in the whole market by hand. You
can correct one, or add a component the dataset never had.

> Think of the Database as a parts encyclopaedia.

### Layer 2 — Parts (the Parts section)

A **part** is a specific listing you found while shopping. It is a spec _plus_ what it costs you:
`Part = Spec + { image?, title, link?, price? }`.

You don't retype the specs. You pick the spec from the Database and attach your own price, link
and photo to it. Two sellers offering the same CPU are two Parts pointing at one Spec.

Price and source link are optional, because a listing is often captured before you know the final
price or have a URL for it. A listing missing either is shown as **incomplete**; filling the field
in later clears the flag. A price of `0` counts as present, and a missing photo never makes a
listing incomplete.

> Think of the Parts section as your shopping shortlist.

### Layer 3 — Builds

A **build** is a named set of Parts — one CPU, one motherboard, one or more memory kits and drives,
and so on. Because a build is made of Parts and not Specs, it knows both whether the machine works
_and_ what it costs.

## What each page is for

### Database (`/database`) — built

The specs encyclopaedia. Pre-seeded with thousands of components across eight categories: CPUs,
CPU coolers, motherboards, memory, storage, video cards, cases and power supplies.

You can:

- **Browse and sort** any category in a virtualised table.
- **Filter** by fields that matter for that category — CPU socket and core count, memory speed,
  DDR, module count, module size and CAS latency, case GPU clearance, PSU wattage, and so on.
- **Add** a component the dataset doesn't have.
- **Add a listing** without leaving the Database: the same creation dialog as the Parts pages opens
  for the selected category, so a spec you just found can be turned into a priced listing straight
  away.
- **Edit** any spec, including a pre-seeded one, correcting bad dataset values. When creating, you
  can start from an existing spec as a preset and adjust it, rather than filling a blank form. The
  preset picker carries the same filters as the table, so look-alike RAM kits can be narrowed by
  DDR generation, module count and size before one is copied.
- **Delete** any spec, seeded or your own, to keep the catalog to parts you'd actually consider.

Editing a seeded spec doesn't destroy the original — your version is stored as an override on top
of it, and deletions are reversible from Settings.

### Parts (`/parts/*`) — built

Your canvassed listings, one page per category.

- **Add a listing**: pick the spec from the Database, then supply a title and the details you
  found — price, source link and a photo. The spec picker shows a distinguishing descriptor for
  each row and can be filtered before picking, which matters for RAM where many kits share a name
  and differ only by DDR version, module count or module size. Price and source link are optional;
  a listing missing either is flagged **incomplete** until you fill it in. The spec's values are
  copied onto the listing, so editing the Database later won't rewrite a listing you already
  recorded.
- **Maintain your shortlist**: search, edit prices as sellers move, and delete listings that sell
  out. A title is unique within its category, which is how two listings of the same spec stay
  separate. The sidebar shows how many listings you have in each category.
- Parts are the only thing a build can be made of, so this is the bridge between research and
  planning.

### Builds (`/builds`) — built

Assemble Parts into a machine and see, live, whether it works and what it costs.

- **A tabbed workspace.** A permanent Builds tab holds the build list. Creating a build opens a
  closable “Create build” tab; saving turns it into that build's tab. Build tabs are always
  editable and have an explicit Save button. Open tabs survive a reload.
- **Live references.** A build stores each part as a `{ type, title }` reference to a Parts listing,
  not a copy. Editing a listing's price or specs immediately changes every build that uses it.
  Renaming a listing follows into builds; deleting one leaves a visible **missing listing**
  warning that can be repaired by picking a replacement.
- **A visual diagram, not a form.** The build tab draws the machine: a solid case frame around a
  dashed motherboard, a dashed cooler ring around the CPU,
  the GPU below, the PSU bottom-left, vertical RAM sticks on the right and storage bays
  bottom-right. Empty required slots stay visible as dashed placeholders, and RAM/storage grow a
  stick or bay per listing. The case fills the available page area: the whole page is the machine,
  with the motherboard, CPU, GPU, PSU, RAM and storage laid out inside it. Hovering any region
  shows that part's specs and price; clicking it selects or changes the part.
- **Right rail.** Beside the diagram, the current total and part count sit above a per-category
  price breakdown (with edit links and remove buttons) and a problems list covering compatibility
  issues, missing listings, incomplete listings and required categories that are still empty.
- **Part selection.** One listing per category, except Memory and Storage, which accept multiple
  listings. Each selected part links to its listing editor in a new browser tab for quick edits.
  The picker flags listings that would conflict with the current build — _Incompatible_ or
  _Warning_, with the specific issue in a tooltip — while still letting you choose them.
- **Totals and completeness.** The total sums the live prices of every resolved listing. Listings
  missing a price or source link are marked incomplete; missing listings are excluded from the
  total and counted separately.
- **Saving.** Build names are unique. Build tabs are editable directly; closing a dirty tab, or
  leaving the page with unsaved build edits, asks before discarding.

The compatibility engine (`lib/rules.ts`) runs against the resolved parts on every edit. It checks:

| Check                                                                 | Severity |
| --------------------------------------------------------------------- | -------- |
| CPU socket matches the motherboard                                    | error    |
| Memory DDR generation matches the motherboard                         | error    |
| Total RAM within the motherboard's maximum                            | warning  |
| Memory modules within the motherboard's slot count                    | warning  |
| GPU's PCIe generation not bottlenecked by the board's slot            | warning  |
| Motherboard form factor fits the case                                 | warning  |
| GPU length fits the case's clearance                                  | warning  |
| Cooler supports the CPU's socket                                      | warning  |
| PSU wattage covers estimated CPU + GPU draw                           | warning  |
| A part's form factor or efficiency isn't in your configured constants | warning  |

Errors mean the build cannot physically work. Warnings mean it probably works but something is
mismatched, undersized or unverifiable.

### Comparison — built (build vs build)

Comparison supports two or more builds, both from the build list and from inside a build tab.

- **From the build list**, hover actions include a comparison toggle. Once anything is selected,
  every card's toggle stays visible. At two selected builds a **Compare** button opens a comparison
  tab.
- **From a build tab**, the **Compare** button opens a searchable build picker and switches that tab
  into comparison mode in place. The diagram stays on the left; the right rail becomes the
  comparison table. The current build stays selected, and **Back to build** returns to the editor
  with unsaved changes intact. Hovering a region of the diagram shows a compact version of that
  category's comparison, limited to the selected builds that have the part.
- **Per-section basis.** Each part category has its own basis, chosen by clicking any value cell in
  that section. CPU can be based on one build while Memory is based on another. The basis column is
  tinted dark green; the tint alone marks it, with no extra label.
- **Percentages share the value cell.** Every numeric field shows its value with the signed delta
  directly beneath it in the same cell, as a separate line rather than a separate table row. This
  keeps neighbouring columns from filling with blank cells.
- **Keyboard basis cycling.** While a category's comparison tooltip is open, **Tab** cycles the
  basis through the builds that have that part and **Shift + Tab** cycles backwards. The hint sits
  at the bottom of the tooltip.
- **Percentages.** Each delta is the signed raw difference from the section basis, coloured green
  when the value is better and red when it is worse. Lower-is-better fields (price, TDP, latency,
  wattage, length) show a green negative percentage. Ordinal labels such as PSU efficiency and
  modularity are coloured but show no percentage, because a percentage of an ordinal is meaningless.
- **Standalone comparison tabs** show the table only: a diagram belongs to one build, and a
  comparison is a set of builds.
- **Multiple listings aggregate.** Memory totals capacity and modules, uses the worst kit's speed
  and latency, and sums price. Storage sums capacity, drive count and cache; mixed descriptive
  values display as **Mixed**.
- **Live.** Comparison resolves builds through the Parts stores, so it always reflects the current
  listing values. Missing listings show as dashes rather than breaking the table.

Part-vs-part comparison is not implemented. Only build-vs-build comparison exists.

### Settings (`/settings`) — built

Two sections, and neither of them touches your parts data directly.

#### Constants

The vocabularies the add/edit forms offer you. When a form shows a dropdown of sockets or PCIe
generations, this is where those options come from.

Scope is deliberate: constants exist **only for values the build validator and comparator reason
about** — form factors, efficiency tiers, PCIe generations, DDR generations, sockets,
microarchitectures and PSU types. Open-ended descriptive fields like colour or GPU chipset are
_not_ constants; those inputs just suggest whatever is already in the catalog and accept anything
you type.

You can add, rename, remove and — for the ranked lists — reorder entries.

**Order is meaningful.** Form factors run smallest to largest and efficiency tiers worst to best,
and the validator compares _positions in your list_. Reordering form factors genuinely changes
which boards it thinks fit which cases. That's the point: the ranking is yours to define.

**Constants never rewrite stored data.** Removing "AM5" from the socket list doesn't touch any CPU
that already records AM5 — it just stops offering AM5 in dropdowns from then on. If a spec holds a
value you've since removed, the validator says so rather than guessing.

Changes are **staged**: nothing is applied until you press Save, so a misclicked delete costs
nothing. Leaving the page with unsaved changes asks first.

#### Stored data

- **Deleted specs** — everything you removed from the Database that came pre-seeded, each
  restorable. Specs you created yourself aren't listed: deleting one is final, since there's no
  original to restore to.
- **Data management** — export, import and reset. Buttons exist; the behaviour isn't implemented.

## Rules that hold everywhere

- **A spec's `name` is its identity.** Two specs in a category can't share a name; renaming one is
  effectively delete-then-create.
- **Your changes layer over the seed, they don't replace it.** Edits are stored as overrides and
  deletions as tombstones, which is why "reset to default" and "restore" are possible at all.
- **Nothing leaves your browser.** All of it — overrides, deletions, constants, parts, builds and
  open build tabs — lives in `localStorage`. Clearing site data clears everything, and nothing
  syncs between devices.

## A worked example

1. You're building a budget gaming PC and spot a used Ryzen 5 5600 for ₱4,200 on Marketplace.
2. It's already in the **Database**, so its specs are known: AM4, 6 cores, 65W.
3. On the CPU **Parts** page you add a listing: pick that spec, paste the link, set ₱4,200, attach
   the seller's photo.
4. You do the same for a used B450 board, a 16 GB DDR4 kit and an RX 6600.
5. In **Builds**, you assemble them. The validator confirms AM4 matches, the DDR4 kit matches the
   board, and warns that your 450 W PSU is close to the estimated draw.
6. You record a second, cheaper board as another Part, swap it into a second build, then **compare**
   the two builds on total price — and click the CPU and memory cells to choose a different basis
   for each section.
7. The seller's listing said "B450M" but the Database has the wrong form factor, so you **edit**
   the spec — and because that's a seeded part, you can revert it later from **Settings**.
