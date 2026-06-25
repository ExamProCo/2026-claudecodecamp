import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { EntityTable, type Column } from "../components/EntityTable";
import { ScopeBadge } from "../components/ScopeBadge";
import type { Mob } from "../data/types";

const columns: Column<Mob>[] = [
  { key: "id", header: "ID", value: (m) => m.id, align: "right" },
  { key: "name", header: "Name", value: (m) => m.short_desc },
  { key: "level", header: "Lvl", value: (m) => m.level, align: "right" },
  { key: "align", header: "Align", value: (m) => m.alignment, align: "right" },
  { key: "ac", header: "AC", value: (m) => m.armor_class, align: "right" },
  { key: "gold", header: "Gold", value: (m) => m.gold, align: "right" },
  { key: "xp", header: "XP", value: (m) => m.xp, align: "right" },
];

export function Mobs() {
  const { world } = useWorld();
  const { inScope } = useZoneScope();
  const rows = Object.values(world.mobs).filter((m) => inScope(m.id));
  return (
    <div>
      <h1>
        Mobs <span className="muted">({rows.length})</span> <ScopeBadge />
      </h1>
      {rows.length === 0 ? (
        <p className="muted">No mobs defined in this zone.</p>
      ) : (
        <EntityTable
          rows={rows}
          columns={columns}
          rowKey={(m) => m.id}
          hrefFor={(m) => `/mobs/${m.id}`}
          searchText={(m) => `${m.aliases.join(" ")} ${m.long_desc}`}
          initialSort="id"
        />
      )}
    </div>
  );
}
