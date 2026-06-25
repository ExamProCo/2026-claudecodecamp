import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { EntityTable, type Column } from "../components/EntityTable";
import { ScopeBadge } from "../components/ScopeBadge";
import type { Room } from "../data/types";

const columns: Column<Room>[] = [
  { key: "id", header: "ID", value: (r) => r.id, align: "right" },
  { key: "name", header: "Name", value: (r) => r.name },
  { key: "zone", header: "Zone", value: (r) => r.zone_number, align: "right" },
  { key: "sector", header: "Sector", value: (r) => r.sector_type.note },
  { key: "exits", header: "Exits", value: (r) => r.exits.length, align: "right" },
];

export function Rooms() {
  const { world } = useWorld();
  const { inScope } = useZoneScope();
  const rows = Object.values(world.rooms).filter((r) => inScope(r.id));
  return (
    <div>
      <h1>
        Rooms <span className="muted">({rows.length})</span> <ScopeBadge />
      </h1>
      {rows.length === 0 ? (
        <p className="muted">No rooms defined in this zone.</p>
      ) : (
        <EntityTable
          rows={rows}
          columns={columns}
          rowKey={(r) => r.id}
          hrefFor={(r) => `/rooms/${r.id}`}
          searchText={(r) => r.desc}
          initialSort="id"
        />
      )}
    </div>
  );
}
