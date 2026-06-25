// Unobtrusive "owned by zone N" breadcrumb for detail pages. Detail pages are never
// filtered by scope, so this just orients you when you arrive via a cross-zone link.
import { useWorld } from "../data/useWorld";
import { ZoneLink } from "./links";

export function ZoneBreadcrumb({ id }: { id: number }) {
  const { relations } = useWorld();
  const zone = relations.zoneOwnerOf(id);
  if (!zone) return null;
  return (
    <span className="zone-breadcrumb">
      <span className="muted">Zone:</span> <ZoneLink id={zone.id} />
    </span>
  );
}
