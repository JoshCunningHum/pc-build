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
`Part = Spec + { image?, title, link, price }`.

You don't retype the specs. You pick the spec from the Database and attach your own price, link
and photo to it. Two sellers offering the same CPU are two Parts pointing at one Spec.

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
- **Filter** by fields that matter for that category — CPU socket and core count, memory speed and
  CAS latency, case GPU clearance, PSU wattage, and so on.
- **Add** a component the dataset doesn't have.
- **Edit** any spec, including a pre-seeded one, correcting bad dataset values. When creating, you
  can start from an existing spec as a preset and adjust it, rather than filling a blank form.
- **Delete** any spec, seeded or your own, to keep the catalog to parts you'd actually consider.

Editing a seeded spec doesn't destroy the original — your version is stored as an override on top
of it, and deletions are reversible from Settings.

### Parts (`/parts/*`) — not built yet

Your canvassed listings, one page per category. The intended shape:

- **Add a listing**: pick the spec from the Database, then supply the price, source link and a
  photo. A title lets you distinguish "Ryzen 5 5600 — FB Marketplace, Cebu" from another seller's.
- **Maintain your shortlist**: edit prices as sellers move, delete listings that sell out.
- Parts are the only thing a build can be made of, so this is the bridge between research and
  planning.

### Builds (`/builds`) — not built yet

Assemble Parts into a machine and see, live, whether it works and what it costs. The compatibility
engine is already written (`lib/rules.ts`); nothing calls it yet. It checks:

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

### Comparison — not built yet

Two flavours:

- **Build vs build** — aggregate each build's parts and compare totals: price, wattage, capacity.
  For answering "is the extra ₱8,000 worth it?"
- **Part vs part** — two components of the same category side by side, spec for spec.

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
- **Nothing leaves your browser.** All of it — overrides, deletions, constants, and eventually
  your parts and builds — lives in `localStorage`. Clearing site data clears everything, and
  nothing syncs between devices.

## A worked example

1. You're building a budget gaming PC and spot a used Ryzen 5 5600 for ₱4,200 on Marketplace.
2. It's already in the **Database**, so its specs are known: AM4, 6 cores, 65W.
3. On the CPU **Parts** page you add a listing: pick that spec, paste the link, set ₱4,200, attach
   the seller's photo.
4. You do the same for a used B450 board, a 16 GB DDR4 kit and an RX 6600.
5. In **Builds**, you assemble them. The validator confirms AM4 matches, the DDR4 kit matches the
   board, and warns that your 450 W PSU is close to the estimated draw.
6. You find a second, cheaper board and add it as another Part, then **compare** the two builds on
   total price.
7. The seller's listing said "B450M" but the Database has the wrong form factor, so you **edit**
   the spec — and because that's a seeded part, you can revert it later from **Settings**.
