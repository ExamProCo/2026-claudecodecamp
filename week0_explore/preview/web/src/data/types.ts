// TypeScript models mirroring the CircleMUD parser JSON in ../data/world.
// Bitvector flags are pre-decoded by the parser as { note, value } pairs.

export interface NoteValue {
  note: string;
  value: number;
}

export interface Dice {
  bonus: number;
  dice: number;
  sides: number;
}

export interface ExtraDesc {
  desc: string;
  keywords: string[];
}

// ---- Rooms (wld) ----

export interface Exit {
  dir: number; // 0=N 1=E 2=S 3=W 4=U 5=D
  room_linked: number; // target room id (-1 = none)
  door_flag: NoteValue;
  key_number: number; // object id of key, or -1
  keywords: string[];
  desc: string;
}

export interface Room {
  id: number;
  name: string;
  desc: string;
  zone_number: number;
  sector_type: NoteValue;
  flags: NoteValue[];
  exits: Exit[];
  extra_descs: ExtraDesc[];
  // Attached trigger vnums (T lines). Populated by the tbaMUD-format parser fix
  // (plan §2/T4); optional so the app compiles before the parser emits it.
  trigger_vnums?: number[];
}

// ---- Mobiles (mob) ----

export interface Mob {
  id: number;
  short_desc: string;
  long_desc: string;
  detail_desc: string;
  aliases: string[];
  level: number;
  alignment: number;
  armor_class: number;
  thac0: number;
  gold: number;
  xp: number;
  mob_type: string;
  gender: NoteValue;
  flags: NoteValue[];
  affects: NoteValue[];
  max_hit_points: Dice;
  bare_hand_damage: Dice;
  position: { default: NoteValue; load: NoteValue };
  extra_spec?: Record<string, unknown>;
  trigger_vnums?: number[]; // attached triggers (T lines); see §2/T4
}

// ---- Objects (obj) ----

export interface Obj {
  id: number;
  short_desc: string;
  long_desc: string;
  action_desc: string | null;
  aliases: string[];
  cost: number;
  rent: number;
  weight: number;
  type: NoteValue;
  values: number[];
  wear: NoteValue[];
  affects: NoteValue[];
  effects: NoteValue[];
  extra_descs: ExtraDesc[];
  trigger_vnums?: number[]; // attached triggers (T lines); see §2/T4
}

// ---- Triggers (DG Scripts, trg) ----

export interface Trigger {
  id: number;
  name: string;
  attach_type: NoteValue; // MOB | OBJ | WLD
  trigger_types: NoteValue[]; // decoded letter bitvector
  numeric_arg: number;
  arglist: string;
  commands: string; // raw DG script body, newlines preserved
}

// ---- Quests (qst) ----

export interface QuestMessages {
  offer: string;
  info: string;
  done: string;
  quit: string;
}

export interface QuestRewards {
  gold: number;
  exp: number;
  obj: number; // object vnum (-1 = none)
}

export interface Quest {
  id: number;
  name: string;
  messages: QuestMessages;
  questmaster: number; // mob vnum (-1 if none)
  type: NoteValue; // AQ_* decoded
  flags: NoteValue[];
  target: number; // kill/get/goto vnum, interpreted per type
  prev_quest: number; // -1 = none
  next_quest: number; // -1 = none
  prereq: number; // prerequisite object vnum (-1 = none)
  value: number[]; // raw value[0..6] slots
  rewards: QuestRewards;
}

// ---- Zones (zon) ----

export interface ZoneItem {
  id: number; // object id
  max: number;
  contents: ZoneItem[];
  location?: number; // wear slot, for equipped items
  note?: string; // wear-slot label, for equipped items
}

export interface ZoneMob {
  mob: number; // mob id
  room: number; // room id it loads into
  max: number;
  equipped: ZoneItem[];
  inventory: ZoneItem[];
}

export interface ZoneObj {
  id: number; // object id
  room: number; // room id it loads into
  max: number;
  contents: ZoneItem[];
}

export interface ZoneDoor {
  room: number;
  exit: number; // direction
  state: number; // door state code
}

export interface ZoneRemove {
  id: number; // object id to remove
  room: number;
}

export interface Zone {
  id: number;
  name: string;
  lifespan: number;
  reset_mode: number;
  bottom_room: number;
  top_room: number;
  mobs: ZoneMob[];
  objects: ZoneObj[];
  doors: ZoneDoor[];
  remove_objects: ZoneRemove[];
}

// ---- Shops (shp) ----

export interface ShopType {
  namelist: string | null;
  note: string;
  value: number;
}

export interface ShopTime {
  open: number;
  close: number;
}

export interface Shop {
  id: number;
  shopkeeper: number; // mob id
  buy_rate: number; // shop's markup when player buys
  sell_rate: number; // shop's payout when player sells
  temper: number;
  flags: NoteValue[];
  buy_types: ShopType[];
  trades_with: NoteValue[];
  objects: number[]; // object ids sold
  rooms: number[]; // room ids the shop operates in
  times: ShopTime[];
  messages: Record<string, string>;
}

// ---- Index bundle (nav summary) ----

export interface IndexEntry {
  id: number;
  name: string;
  // Owning zone id by vnum range, or null if outside every zone range ("Unzoned").
  zone: number | null;
}

// Zones index themselves; they carry their own range rather than an owner.
export interface ZoneIndexEntry {
  id: number;
  name: string;
  bottom: number;
  top: number;
}

// Per-type entity counts, used for both the global ("All zones") totals and the
// scoped totals in countsByZone.
export interface TypeCounts {
  rooms: number;
  mobs: number;
  objects: number;
  shops: number;
  triggers: number;
  quests: number;
}

export interface WorldIndex {
  generatedAt: string;
  counts: TypeCounts & { zones: number };
  // Scoped counts keyed by zone id (and "unzoned" for the synthetic bucket).
  countsByZone: Record<string, TypeCounts>;
  rooms: IndexEntry[];
  mobs: IndexEntry[];
  objects: IndexEntry[];
  zones: ZoneIndexEntry[];
  shops: IndexEntry[];
  triggers: IndexEntry[];
  quests: IndexEntry[];
}

export type EntityKind =
  | "rooms"
  | "mobs"
  | "objects"
  | "zones"
  | "shops"
  | "triggers"
  | "quests";

// Compass direction labels indexed by Exit.dir.
export const DIRECTIONS = ["North", "East", "South", "West", "Up", "Down"] as const;
export const DIR_SHORT = ["N", "E", "S", "W", "U", "D"] as const;
