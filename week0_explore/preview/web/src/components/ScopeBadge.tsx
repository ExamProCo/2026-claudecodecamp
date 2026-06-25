// Small header suffix showing the active scope: "· zone 30 · Name" or "· all zones".
import { useZoneScope } from "../data/zoneScope";

export function ScopeBadge() {
  const { currentZone } = useZoneScope();
  return (
    <span className="scope-badge muted">
      {currentZone ? `· zone ${currentZone.id} · ${currentZone.name}` : "· all zones"}
    </span>
  );
}
