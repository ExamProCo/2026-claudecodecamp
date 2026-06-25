// The single global scope control: pick a zone (or "All zones") to filter the whole
// app. Backed by useZoneScope, so it stays in sync with the URL `?zone=` param and the
// map's own selector.
import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";

export function ZoneSelect() {
  const { world } = useWorld();
  const { scope, setScope } = useZoneScope();

  return (
    <label className="zone-select">
      <span className="muted small">Scope</span>
      <select
        value={scope.zoneId === "all" ? "all" : String(scope.zoneId)}
        onChange={(e) =>
          setScope(e.target.value === "all" ? "all" : Number(e.target.value))
        }
      >
        <option value="all">All zones</option>
        {world.index.zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.id} · {z.name}
          </option>
        ))}
      </select>
    </label>
  );
}
