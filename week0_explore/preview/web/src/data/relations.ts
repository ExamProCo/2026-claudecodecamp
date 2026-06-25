// Cross-reference + reverse-index helpers, built once from a loaded World.
// Forward links live in the data; these indexes answer the inverse questions
// detail pages need ("which zone spawns this mob?", "who exits into this room?").

import type { World } from "./load";
import type { Exit, Quest, Room, Zone } from "./types";

// An entity that runs a given trigger (the inverse of its T lines).
export type TriggerAttachKind = "mob" | "obj" | "room";
export interface TriggerAttachment {
  kind: TriggerAttachKind;
  id: number;
}

export interface InboundExit {
  fromRoom: number;
  dir: number;
}

// One room->room exit that crosses a zone boundary, retaining enough context for
// the detail panel ("#3014 (zone 30) --east--> #6001 (zone 6)").
export interface ZoneCrossing {
  fromRoom: number;
  toRoom: number;
  dir: number;
  door: boolean;
  fromZone: number;
  toZone: number;
}

// All boundary crossings between an unordered pair of zones, collapsed to one edge.
export interface ZoneLink {
  a: number; // zone id, always a < b for a stable key
  b: number;
  crossings: ZoneCrossing[];
  count: number; // total crossings (edge thickness / label)
  bidirectional: boolean; // crossings exist in both directions
}

export interface MobSpawn {
  mob: number; // mob id
  zoneId: number;
  room: number;
  max: number;
}

export interface ObjectLoad {
  objId: number; // object id
  zoneId: number;
  room: number;
  max: number;
  // how it loads: directly in a room, inside a mob's inventory/equipment, or in a container
  via: "room" | "inventory" | "equipped";
  mob?: number; // owning mob, when via inventory/equipped
}

export interface RoomContents {
  mobs: MobSpawn[]; // mobs spawned into this room
  objects: ObjectLoad[]; // objects loaded directly into this room
}

export class Relations {
  private inbound = new Map<number, InboundExit[]>();
  private mobSpawns = new Map<number, MobSpawn[]>();
  private objectLoads = new Map<number, ObjectLoad[]>();
  private roomContents = new Map<number, RoomContents>();
  private shopsByObject = new Map<number, number[]>();
  private shopsByKeeper = new Map<number, number[]>();
  private shopsByRoom = new Map<number, number[]>();
  private zoneLinkMap = new Map<string, ZoneLink>();
  private triggerAttachments = new Map<number, TriggerAttachment[]>();
  private questsByMaster = new Map<number, number[]>();

  constructor(private world: World) {
    this.build();
  }

  private push<T>(map: Map<number, T[]>, key: number, value: T) {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  }

  private ensureRoom(roomId: number): RoomContents {
    let rc = this.roomContents.get(roomId);
    if (!rc) {
      rc = { mobs: [], objects: [] };
      this.roomContents.set(roomId, rc);
    }
    return rc;
  }

  // Roll a single boundary-crossing exit up into its unordered {za, zb} zone link.
  // In-zone exits (za == zb) are skipped — that's the per-zone map's job.
  private recordCrossing(room: Room, exit: Exit) {
    const za = this.zoneForRoom(room.id);
    const zb = this.zoneForRoom(exit.room_linked);
    if (!za || !zb || za.id === zb.id) return;

    const a = Math.min(za.id, zb.id);
    const b = Math.max(za.id, zb.id);
    const key = `${a}-${b}`;
    let link = this.zoneLinkMap.get(key);
    if (!link) {
      link = { a, b, crossings: [], count: 0, bidirectional: false };
      this.zoneLinkMap.set(key, link);
    }
    link.crossings.push({
      fromRoom: room.id,
      toRoom: exit.room_linked,
      dir: exit.dir,
      door: exit.door_flag.note !== "NO_DOOR",
      fromZone: za.id,
      toZone: zb.id,
    });
    link.count++;
  }

  private build() {
    // Inbound exits + zone crossings: a single pass over every room's exits feeds
    // both the reverse-edge index and the zone-level connectivity graph.
    for (const room of Object.values(this.world.rooms)) {
      for (const exit of room.exits) {
        if (exit.room_linked >= 0) {
          this.push(this.inbound, exit.room_linked, { fromRoom: room.id, dir: exit.dir });
          this.recordCrossing(room, exit);
        }
      }
    }

    // Direction of each link is derived from its crossings once they're all in.
    for (const link of this.zoneLinkMap.values()) {
      const fromA = link.crossings.some((c) => c.fromZone === link.a);
      const fromB = link.crossings.some((c) => c.fromZone === link.b);
      link.bidirectional = fromA && fromB;
    }

    // Zone resets: mob spawns, object loads (incl. inside mobs), room contents.
    for (const zone of Object.values(this.world.zones)) {
      for (const zm of zone.mobs) {
        const spawn: MobSpawn = { mob: zm.mob, zoneId: zone.id, room: zm.room, max: zm.max };
        this.push(this.mobSpawns, zm.mob, spawn);
        this.ensureRoom(zm.room).mobs.push(spawn);

        for (const item of zm.inventory) {
          this.push(this.objectLoads, item.id, {
            objId: item.id,
            zoneId: zone.id,
            room: zm.room,
            max: item.max,
            via: "inventory",
            mob: zm.mob,
          });
        }
        for (const item of zm.equipped) {
          this.push(this.objectLoads, item.id, {
            objId: item.id,
            zoneId: zone.id,
            room: zm.room,
            max: item.max,
            via: "equipped",
            mob: zm.mob,
          });
        }
      }
      for (const zo of zone.objects) {
        const load: ObjectLoad = { objId: zo.id, zoneId: zone.id, room: zo.room, max: zo.max, via: "room" };
        this.push(this.objectLoads, zo.id, load);
        this.ensureRoom(zo.room).objects.push(load);
      }
    }

    // Shops: keeper -> shop, object -> shops, room -> shops.
    for (const shop of Object.values(this.world.shops)) {
      this.push(this.shopsByKeeper, shop.shopkeeper, shop.id);
      for (const objId of shop.objects) this.push(this.shopsByObject, objId, shop.id);
      for (const roomId of shop.rooms) this.push(this.shopsByRoom, roomId, shop.id);
    }

    // Trigger attachments: each mob/obj/room lists the triggers it runs (T lines).
    // Gated on the tbaMUD-format fix (plan §2) — trigger_vnums is absent until then,
    // so these maps stay empty (and the forward query degrades to []) for now.
    this.indexAttachments("mob", this.world.mobs);
    this.indexAttachments("obj", this.world.objects);
    this.indexAttachments("room", this.world.rooms);

    // Quests by questmaster mob (works as soon as the qst bundle loads).
    for (const quest of Object.values(this.world.quests)) {
      if (quest.questmaster >= 0) this.push(this.questsByMaster, quest.questmaster, quest.id);
    }
  }

  private indexAttachments(kind: TriggerAttachKind, entities: Record<string, { id: number; trigger_vnums?: number[] }>) {
    for (const e of Object.values(entities)) {
      for (const trigVnum of e.trigger_vnums ?? []) {
        this.push(this.triggerAttachments, trigVnum, { kind, id: e.id });
      }
    }
  }

  // ---- queries ----

  inboundExits(roomId: number): InboundExit[] {
    return this.inbound.get(roomId) ?? [];
  }

  /**
   * The zone that owns any entity id (room, mob, object, or shop) by vnum range.
   * CircleMUD zones own a contiguous, non-overlapping bottom_room..top_room block
   * shared by every entity type, so this single lookup partitions the whole world.
   */
  zoneOwnerOf(id: number): Zone | undefined {
    for (const zone of Object.values(this.world.zones)) {
      if (id >= zone.bottom_room && id <= zone.top_room) return zone;
    }
    return undefined;
  }

  /** The zone that owns a room, by zone_number then by vnum-range fallback. */
  zoneForRoom(roomId: number): Zone | undefined {
    const room = this.world.rooms[roomId];
    if (room) {
      const byNumber = this.world.zones[room.zone_number];
      if (byNumber) return byNumber;
    }
    return this.zoneOwnerOf(roomId);
  }

  roomsInZone(zone: Zone): number[] {
    return Object.values(this.world.rooms)
      .filter((r) => r.id >= zone.bottom_room && r.id <= zone.top_room)
      .map((r) => r.id)
      .sort((a, b) => a - b);
  }

  spawnsForMob(mobId: number): MobSpawn[] {
    return this.mobSpawns.get(mobId) ?? [];
  }

  loadsForObject(objId: number): ObjectLoad[] {
    return this.objectLoads.get(objId) ?? [];
  }

  contentsOfRoom(roomId: number): RoomContents {
    return this.roomContents.get(roomId) ?? { mobs: [], objects: [] };
  }

  shopsSellingObject(objId: number): number[] {
    return this.shopsByObject.get(objId) ?? [];
  }

  shopsForKeeper(mobId: number): number[] {
    return this.shopsByKeeper.get(mobId) ?? [];
  }

  shopsInRoom(roomId: number): number[] {
    return this.shopsByRoom.get(roomId) ?? [];
  }

  /** Trigger vnums attached to (run by) a mob / object / room. §2-gated. */
  triggersForEntity(kind: TriggerAttachKind, id: number): number[] {
    const entity =
      kind === "mob"
        ? this.world.mobs[id]
        : kind === "obj"
          ? this.world.objects[id]
          : this.world.rooms[id];
    return entity?.trigger_vnums ?? [];
  }

  /** Every mob / object / room that runs a given trigger (inverse of T lines). §2-gated. */
  attachmentsOfTrigger(trigVnum: number): TriggerAttachment[] {
    return this.triggerAttachments.get(trigVnum) ?? [];
  }

  /** Quest vnums a mob is the questmaster for. */
  questsForQuestmaster(mobVnum: number): number[] {
    return this.questsByMaster.get(mobVnum) ?? [];
  }

  /**
   * The full prev/next chain containing a quest, ordered head-to-tail. Walks back
   * to the head then forward, guarding against malformed cyclic links.
   */
  questChain(questVnum: number): number[] {
    const quests = this.world.quests;
    const start = quests[questVnum];
    if (!start) return [];

    let head: Quest = start;
    const backSeen = new Set<number>([head.id]);
    while (head.prev_quest >= 0 && quests[head.prev_quest] && !backSeen.has(head.prev_quest)) {
      head = quests[head.prev_quest];
      backSeen.add(head.id);
    }

    const chain: number[] = [];
    const seen = new Set<number>();
    let cur: Quest | undefined = head;
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      chain.push(cur.id);
      cur = cur.next_quest >= 0 ? quests[cur.next_quest] : undefined;
    }
    return chain;
  }

  /** Every zone-to-zone link in the world (one per boundary-crossing pair). */
  zoneLinks(): ZoneLink[] {
    return [...this.zoneLinkMap.values()];
  }

  /** The links touching a given zone, for its "Connects to" view. */
  zoneLinksFor(zoneId: number): ZoneLink[] {
    return this.zoneLinks().filter((l) => l.a === zoneId || l.b === zoneId);
  }
}

let relationsCache: { world: World; relations: Relations } | null = null;

/** Memoized Relations for a given World instance. */
export function getRelations(world: World): Relations {
  if (!relationsCache || relationsCache.world !== world) {
    relationsCache = { world, relations: new Relations(world) };
  }
  return relationsCache.relations;
}
