# World Preview

A **read-only** React admin panel for browsing the parsed CircleMUD world data
(README Goal 3: *Visualize the World Data*). It is a developer/inspection tool —
the MUD agent never sees it.

## What it does

- Browse all **rooms, mobs, objects, zones, shops** with sortable/filterable tables.
- Detail pages that follow the relationships between entities (exits, zone resets,
  shop keepers/products) — every id is a clickable cross-reference, including
  **reverse** links (what spawns here, who exits into this room, who sells this).
- An interactive **per-zone map** (React Flow + dagre): rooms as nodes colored by
  sector, exits as directed edges, doors dashed. Click a room to open its detail.
- A **raw JSON** toggle on every detail page for ground-truth inspection.
- Global search across all entity types.

## Running it

```bash
cd week0_explore/preview/web
npm install
npm run dev          # builds data bundles, then starts Vite on :5174
```

Open <http://localhost:5174>.

## How the data flows

1. [`bin/convert-world`](../../bin/convert-world) parses the raw CircleMUD world
   files into per-file JSON under `preview/data/world/{wld,mob,obj,zon,shp}/`.
2. `scripts/build-data.mjs` aggregates those into compact, id-keyed bundles in
   `public/data/` (`rooms.json`, `mobs.json`, …, plus an `index.json` nav summary).
   `npm run dev` / `npm run build` run this automatically (`npm run build:data` to
   run it alone).
3. The SPA fetches the bundles, builds reverse indexes in memory
   (`src/data/relations.ts`), and renders everything client-side. No backend.

Both `node_modules/` and the generated `public/data/` are gitignored (derived data).

## Scope

Read-only. Editing (writing back to CircleMUD world files) is deferred to a later
plan, as is the whole-world / inter-zone map.
