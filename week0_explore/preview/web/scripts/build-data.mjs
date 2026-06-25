// Aggregate the per-file CircleMUD JSON (../data/world/<type>/*.json) into a few
// compact, id-keyed bundles the SPA can fetch and cross-reference in memory.
//
//   public/data/rooms.json    map id -> Room
//   public/data/mobs.json     map id -> Mob
//   public/data/objects.json  map id -> Obj
//   public/data/zones.json    map id -> Zone
//   public/data/shops.json    map id -> Shop
//   public/data/index.json    lightweight nav summary (counts + id/name lists)
//
// Read-only: this script only ever reads world JSON and writes bundles.

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB = join(__dirname, "..");
const SRC = join(WEB, "..", "data", "world"); // ../data/world relative to web/
const OUT = join(WEB, "public", "data");

// type folder -> { bundle filename, fn to extract a display name from an entity }
const TYPES = {
  wld: { bundle: "rooms.json", name: (e) => e.name },
  mob: { bundle: "mobs.json", name: (e) => e.short_desc ?? e.long_desc ?? `mob ${e.id}` },
  obj: { bundle: "objects.json", name: (e) => e.short_desc ?? e.long_desc ?? `obj ${e.id}` },
  zon: { bundle: "zones.json", name: (e) => e.name ?? `zone ${e.id}` },
  shp: { bundle: "shops.json", name: (e) => `shop ${e.id}` },
  trg: { bundle: "triggers.json", name: (e) => e.name ?? `trigger ${e.id}` },
  qst: { bundle: "quests.json", name: (e) => e.name ?? `quest ${e.id}` },
};

async function loadType(type) {
  const dir = join(SRC, type);
  if (!existsSync(dir)) {
    console.warn(`! missing ${dir} — skipping ${type}`);
    return [];
  }
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const all = [];
  for (const f of files) {
    const raw = await readFile(join(dir, f), "utf8");
    const arr = JSON.parse(raw);
    for (const e of arr) all.push(e);
  }
  return all;
}

function toMap(entities) {
  const map = {};
  for (const e of entities) map[e.id] = e;
  return map;
}

// Build a vnum-range owner lookup from the zones. CircleMUD zones own a
// contiguous, non-overlapping block of vnums (bottom_room..top_room) and every
// entity type shares that block, so a single sorted scan partitions the world.
// Returns zoneOwnerOf(id) -> zone id (or null if the id falls outside all ranges).
function makeZoneOwner(zones) {
  const ranges = zones
    .map((z) => ({ id: z.id, bottom: z.bottom_room, top: z.top_room }))
    .sort((a, b) => a.bottom - b.bottom);
  return function zoneOwnerOf(id) {
    for (const r of ranges) {
      if (id < r.bottom) break; // ranges are sorted; no later range can contain id
      if (id <= r.top) return r.id;
    }
    return null;
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // Load every type up front so zone ranges are available before we assign
  // ownership to rooms/mobs/objects/shops (which the per-type loop can't
  // guarantee, since it processes types in folder order).
  const loaded = {};
  for (const [type, cfg] of Object.entries(TYPES)) {
    loaded[type] = await loadType(type);
  }

  const zoneOwnerOf = makeZoneOwner(loaded.zon);

  // Scoped counts per zone, plus an "Unzoned" bucket (null) for any entity that
  // falls outside every zone range. Today that bucket is empty, but we never drop
  // an entity if the parser ever produces an out-of-range vnum.
  const countsByZone = {};
  const bumpCount = (zoneId, key) => {
    const bucket = (countsByZone[zoneId] ??= {
      rooms: 0,
      mobs: 0,
      objects: 0,
      shops: 0,
      triggers: 0,
      quests: 0,
    });
    bucket[key] += 1;
  };

  const index = {
    generatedAt: new Date().toISOString(),
    counts: {},
    countsByZone,
    // per-type [id, name, zone] entries for nav / search
    rooms: [],
    mobs: [],
    objects: [],
    zones: [],
    shops: [],
    triggers: [],
    quests: [],
  };

  for (const [type, cfg] of Object.entries(TYPES)) {
    const entities = loaded[type];
    const map = toMap(entities);
    await writeFile(join(OUT, cfg.bundle), JSON.stringify(map));

    const key = cfg.bundle.replace(".json", "");
    index.counts[key] = entities.length;

    if (type === "zon") {
      // zones carry room ranges, useful for nav + map selector
      index.zones = entities
        .map((z) => ({ id: z.id, name: cfg.name(z), bottom: z.bottom_room, top: z.top_room }))
        .sort((a, b) => a.id - b.id);
    } else {
      index[key] = entities
        .map((e) => {
          const zone = zoneOwnerOf(e.id);
          bumpCount(zone ?? "unzoned", key);
          return { id: e.id, name: cfg.name(e), zone };
        })
        .sort((a, b) => a.id - b.id);
    }

    console.log(`  ${type} -> ${cfg.bundle} (${entities.length})`);
  }

  await writeFile(join(OUT, "index.json"), JSON.stringify(index));
  console.log(`Done. Bundles written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
