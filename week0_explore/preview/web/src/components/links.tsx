// Cross-reference link helpers. Each resolves an entity id to its name (when the
// world is loaded) and renders a router Link to that entity's detail page.
import { Link } from "react-router";
import { useWorld } from "../data/useWorld";

export function RoomLink({ id, label }: { id: number; label?: string }) {
  const { world } = useWorld();
  if (id < 0) return <span className="muted">none</span>;
  const room = world.rooms[id];
  return (
    <Link to={`/rooms/${id}`} className="xref">
      {label ?? room?.name ?? `room ${id}`} <span className="idtag">#{id}</span>
    </Link>
  );
}

export function MobLink({ id }: { id: number }) {
  const { world } = useWorld();
  const mob = world.mobs[id];
  return (
    <Link to={`/mobs/${id}`} className="xref">
      {mob?.short_desc ?? `mob ${id}`} <span className="idtag">#{id}</span>
    </Link>
  );
}

export function ObjectLink({ id }: { id: number }) {
  const { world } = useWorld();
  const obj = world.objects[id];
  return (
    <Link to={`/objects/${id}`} className="xref">
      {obj?.short_desc ?? `object ${id}`} <span className="idtag">#{id}</span>
    </Link>
  );
}

export function ZoneLink({ id }: { id: number }) {
  const { world } = useWorld();
  const zone = world.zones[id];
  return (
    <Link to={`/zones/${id}`} className="xref">
      {zone?.name ?? `zone ${id}`} <span className="idtag">#{id}</span>
    </Link>
  );
}

export function ShopLink({ id }: { id: number }) {
  return (
    <Link to={`/shops/${id}`} className="xref">
      shop <span className="idtag">#{id}</span>
    </Link>
  );
}

export function TriggerLink({ id }: { id: number }) {
  const { world } = useWorld();
  if (id < 0) return <span className="muted">none</span>;
  const trig = world.triggers[id];
  return (
    <Link to={`/triggers/${id}`} className="xref">
      {trig?.name ?? `trigger ${id}`} <span className="idtag">#{id}</span>
    </Link>
  );
}

export function QuestLink({ id }: { id: number }) {
  const { world } = useWorld();
  if (id < 0) return <span className="muted">none</span>;
  const quest = world.quests[id];
  return (
    <Link to={`/quests/${id}`} className="xref">
      {quest?.name ?? `quest ${id}`} <span className="idtag">#{id}</span>
    </Link>
  );
}
