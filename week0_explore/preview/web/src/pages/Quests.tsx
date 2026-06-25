import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { EntityTable, type Column } from "../components/EntityTable";
import { ScopeBadge } from "../components/ScopeBadge";
import { ZoneLink } from "../components/links";
import type { Quest } from "../data/types";

export function Quests() {
  const { world, relations } = useWorld();
  const { inScope } = useZoneScope();
  const rows = Object.values(world.quests).filter((q) => inScope(q.id));

  const columns: Column<Quest>[] = [
    { key: "id", header: "ID", value: (q) => q.id, align: "right" },
    { key: "name", header: "Name", value: (q) => q.name },
    { key: "type", header: "Type", value: (q) => q.type.note ?? "—" },
    {
      key: "qm",
      header: "Questmaster",
      value: (q) => (q.questmaster >= 0 ? world.mobs[q.questmaster]?.short_desc ?? `mob ${q.questmaster}` : "—"),
    },
    { key: "target", header: "Target", value: (q) => (q.target >= 0 ? q.target : "—"), align: "right" },
    {
      key: "zone",
      header: "Zone",
      value: (q) => relations.zoneOwnerOf(q.id)?.name ?? "",
      render: (q) => {
        const zone = relations.zoneOwnerOf(q.id);
        return zone ? <ZoneLink id={zone.id} /> : <span className="muted">—</span>;
      },
    },
  ];

  return (
    <div>
      <h1>
        Quests <span className="muted">({rows.length})</span> <ScopeBadge />
      </h1>
      {rows.length === 0 ? (
        <p className="muted">No quests defined in this zone.</p>
      ) : (
        <EntityTable
          rows={rows}
          columns={columns}
          rowKey={(q) => q.id}
          hrefFor={(q) => `/quests/${q.id}`}
          // Search across the quest message text.
          searchText={(q) => `${q.messages.offer} ${q.messages.info} ${q.messages.done} ${q.messages.quit}`}
          initialSort="id"
        />
      )}
    </div>
  );
}
