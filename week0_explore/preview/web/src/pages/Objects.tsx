import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { EntityTable, type Column } from "../components/EntityTable";
import { ScopeBadge } from "../components/ScopeBadge";
import type { Obj } from "../data/types";

const columns: Column<Obj>[] = [
  { key: "id", header: "ID", value: (o) => o.id, align: "right" },
  { key: "name", header: "Name", value: (o) => o.short_desc },
  { key: "type", header: "Type", value: (o) => o.type.note },
  { key: "cost", header: "Cost", value: (o) => o.cost, align: "right" },
  { key: "rent", header: "Rent", value: (o) => o.rent, align: "right" },
  { key: "weight", header: "Wt", value: (o) => o.weight, align: "right" },
];

export function Objects() {
  const { world } = useWorld();
  const { inScope } = useZoneScope();
  const rows = Object.values(world.objects).filter((o) => inScope(o.id));
  return (
    <div>
      <h1>
        Objects <span className="muted">({rows.length})</span> <ScopeBadge />
      </h1>
      {rows.length === 0 ? (
        <p className="muted">No objects defined in this zone.</p>
      ) : (
        <EntityTable
          rows={rows}
          columns={columns}
          rowKey={(o) => o.id}
          hrefFor={(o) => `/objects/${o.id}`}
          searchText={(o) => `${o.aliases.join(" ")} ${o.long_desc}`}
          initialSort="id"
        />
      )}
    </div>
  );
}
