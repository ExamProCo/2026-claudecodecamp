import { useWorld } from "../data/useWorld";
import { EntityTable, type Column } from "../components/EntityTable";
import type { Zone } from "../data/types";

const columns: Column<Zone>[] = [
  { key: "id", header: "ID", value: (z) => z.id, align: "right" },
  { key: "name", header: "Name", value: (z) => z.name },
  { key: "rooms", header: "Rooms", value: (z) => z.top_room - z.bottom_room + 1, align: "right" },
  {
    key: "range",
    header: "Range",
    value: (z) => z.bottom_room,
    render: (z) => `${z.bottom_room}–${z.top_room}`,
    align: "right",
  },
  { key: "resets", header: "Resets", value: (z) => z.mobs.length + z.objects.length, align: "right" },
  { key: "lifespan", header: "Lifespan", value: (z) => z.lifespan, align: "right" },
];

export function Zones() {
  const { world } = useWorld();
  const rows = Object.values(world.zones);
  return (
    <div>
      <h1>Zones <span className="muted">({rows.length})</span></h1>
      <EntityTable
        rows={rows}
        columns={columns}
        rowKey={(z) => z.id}
        hrefFor={(z) => `/zones/${z.id}`}
        initialSort="id"
      />
    </div>
  );
}
