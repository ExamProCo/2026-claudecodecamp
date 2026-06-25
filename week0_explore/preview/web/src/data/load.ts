// Fetch + cache the generated bundles from /data/*.json. Each bundle is an
// id-keyed map; the index is a lightweight nav summary. Everything is read-only
// and small (~4 MB total) so we keep loaded bundles in memory for the session.

import type { Mob, Obj, Quest, Room, Shop, Trigger, WorldIndex, Zone } from "./types";

type Bundle<T> = Record<string, T>;

const cache = new Map<string, unknown>();

async function fetchJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached) return cached as T;
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as T;
  cache.set(path, data);
  return data;
}

export function loadIndex(): Promise<WorldIndex> {
  return fetchJson<WorldIndex>(`${import.meta.env.BASE_URL}data/index.json`);
}

export function loadRooms(): Promise<Bundle<Room>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/rooms.json`);
}

export function loadMobs(): Promise<Bundle<Mob>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/mobs.json`);
}

export function loadObjects(): Promise<Bundle<Obj>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/objects.json`);
}

export function loadZones(): Promise<Bundle<Zone>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/zones.json`);
}

export function loadShops(): Promise<Bundle<Shop>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/shops.json`);
}

export function loadTriggers(): Promise<Bundle<Trigger>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/triggers.json`);
}

export function loadQuests(): Promise<Bundle<Quest>> {
  return fetchJson(`${import.meta.env.BASE_URL}data/quests.json`);
}

// Load every bundle at once (used by detail pages that cross-reference types).
export interface World {
  index: WorldIndex;
  rooms: Bundle<Room>;
  mobs: Bundle<Mob>;
  objects: Bundle<Obj>;
  zones: Bundle<Zone>;
  shops: Bundle<Shop>;
  triggers: Bundle<Trigger>;
  quests: Bundle<Quest>;
}

let worldPromise: Promise<World> | null = null;

export function loadWorld(): Promise<World> {
  if (!worldPromise) {
    worldPromise = (async () => {
      const [index, rooms, mobs, objects, zones, shops, triggers, quests] = await Promise.all([
        loadIndex(),
        loadRooms(),
        loadMobs(),
        loadObjects(),
        loadZones(),
        loadShops(),
        loadTriggers(),
        loadQuests(),
      ]);
      return { index, rooms, mobs, objects, zones, shops, triggers, quests };
    })();
  }
  return worldPromise;
}
