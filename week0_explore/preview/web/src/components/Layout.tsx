// App shell: sidebar nav with entity counts + global search and zone scope, content
// outlet. Nav counts switch to the scoped per-zone numbers when a zone is selected.
import { NavLink, Outlet } from "react-router";
import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { GlobalSearch } from "./GlobalSearch";
import { ZoneSelect } from "./ZoneSelect";
import type { TypeCounts } from "../data/types";

// countKey indexes the global counts; "zones" is never scoped (it's the navigator).
const NAV: { to: string; label: string; countKey?: keyof TypeCounts | "zones" }[] = [
  { to: "/", label: "Dashboard" },
  { to: "/rooms", label: "Rooms", countKey: "rooms" },
  { to: "/mobs", label: "Mobs", countKey: "mobs" },
  { to: "/objects", label: "Objects", countKey: "objects" },
  { to: "/zones", label: "Zones", countKey: "zones" },
  { to: "/shops", label: "Shops", countKey: "shops" },
  { to: "/triggers", label: "Triggers", countKey: "triggers" },
  { to: "/quests", label: "Quests", countKey: "quests" },
  { to: "/map", label: "Map" },
  { to: "/world-map", label: "World Map" },
];

export function Layout() {
  const { world } = useWorld();
  const { currentZone } = useZoneScope();
  const global = world.index.counts;
  // Scoped totals when a single zone is selected; the Zones count stays global.
  const scoped = currentZone ? world.index.countsByZone[currentZone.id] : null;

  function countFor(key: keyof TypeCounts | "zones"): number {
    if (key === "zones") return global.zones;
    if (scoped) return scoped[key] ?? 0;
    return global[key];
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <strong>World Preview</strong>
          <span className="muted">tbaMUD · read-only</span>
        </div>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}>
              <span>{n.label}</span>
              {n.countKey && <span className="count">{countFor(n.countKey)}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <GlobalSearch />
          <ZoneSelect />
        </header>
        <div className="page">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
