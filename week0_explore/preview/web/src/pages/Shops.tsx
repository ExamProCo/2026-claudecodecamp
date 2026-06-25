import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { EntityTable, type Column } from "../components/EntityTable";
import { ScopeBadge } from "../components/ScopeBadge";
import type { Shop } from "../data/types";

export function Shops() {
  const { world } = useWorld();
  const { inScope } = useZoneScope();
  const rows = Object.values(world.shops).filter((s) => inScope(s.id));

  const columns: Column<Shop>[] = [
    { key: "id", header: "ID", value: (s) => s.id, align: "right" },
    {
      key: "keeper",
      header: "Keeper",
      value: (s) => world.mobs[s.shopkeeper]?.short_desc ?? `mob ${s.shopkeeper}`,
    },
    { key: "products", header: "Products", value: (s) => s.objects.length, align: "right" },
    { key: "buy", header: "Buy ×", value: (s) => s.buy_rate, align: "right" },
    { key: "sell", header: "Sell ×", value: (s) => s.sell_rate, align: "right" },
  ];

  return (
    <div>
      <h1>
        Shops <span className="muted">({rows.length})</span> <ScopeBadge />
      </h1>
      {rows.length === 0 ? (
        <p className="muted">No shops defined in this zone.</p>
      ) : (
        <EntityTable
          rows={rows}
          columns={columns}
          rowKey={(s) => s.id}
          hrefFor={(s) => `/shops/${s.id}`}
          initialSort="id"
        />
      )}
    </div>
  );
}
