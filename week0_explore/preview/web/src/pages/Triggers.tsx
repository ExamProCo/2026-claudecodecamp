import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { EntityTable, type Column } from "../components/EntityTable";
import { ScopeBadge } from "../components/ScopeBadge";
import { ZoneLink } from "../components/links";
import type { Trigger } from "../data/types";

export function Triggers() {
  const { world, relations } = useWorld();
  const { inScope } = useZoneScope();
  const rows = Object.values(world.triggers).filter((t) => inScope(t.id));

  const columns: Column<Trigger>[] = [
    { key: "id", header: "ID", value: (t) => t.id, align: "right" },
    { key: "name", header: "Name", value: (t) => t.name },
    { key: "attach", header: "Attaches to", value: (t) => t.attach_type.note },
    {
      key: "types",
      header: "Types",
      value: (t) => t.trigger_types.map((x) => x.note).join(", ") || "—",
    },
    {
      key: "zone",
      header: "Zone",
      value: (t) => relations.zoneOwnerOf(t.id)?.name ?? "",
      render: (t) => {
        const zone = relations.zoneOwnerOf(t.id);
        return zone ? <ZoneLink id={zone.id} /> : <span className="muted">—</span>;
      },
    },
  ];

  return (
    <div>
      <h1>
        Triggers <span className="muted">({rows.length})</span> <ScopeBadge />
      </h1>
      <p className="muted small">
        DG Script behaviour attached to mobs, objects, and rooms. Scripts are shown verbatim.
      </p>
      {rows.length === 0 ? (
        <p className="muted">No triggers defined in this zone.</p>
      ) : (
        <EntityTable
          rows={rows}
          columns={columns}
          rowKey={(t) => t.id}
          hrefFor={(t) => `/triggers/${t.id}`}
          // Search across the script body too, so "%teleport%" finds the triggers that use it.
          searchText={(t) => `${t.arglist} ${t.commands}`}
          initialSort="id"
        />
      )}
    </div>
  );
}
