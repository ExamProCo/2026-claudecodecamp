// Overview. In "All zones" mode: global counts + the full zone list with room ranges.
// When a single zone is scoped: scoped counts and a focused summary of that zone.
import { Link } from "react-router";
import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { ScopeBadge } from "../components/ScopeBadge";

export function Dashboard() {
  const { world } = useWorld();
  const { currentZone } = useZoneScope();

  if (currentZone) return <ZoneDashboard zoneId={currentZone.id} />;

  const c = world.index.counts;
  const cards = [
    { label: "Rooms", n: c.rooms, to: "/rooms" },
    { label: "Mobs", n: c.mobs, to: "/mobs" },
    { label: "Objects", n: c.objects, to: "/objects" },
    { label: "Zones", n: c.zones, to: "/zones" },
    { label: "Shops", n: c.shops, to: "/shops" },
  ];
  return (
    <div className="dashboard">
      <h1>
        World Preview <ScopeBadge />
      </h1>
      <p className="muted">
        Read-only browser for the parsed CircleMUD world. Generated{" "}
        {new Date(world.index.generatedAt).toLocaleString()}.
      </p>

      <div className="cards">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="card">
            <span className="card-n">{card.n.toLocaleString()}</span>
            <span className="card-label">{card.label}</span>
          </Link>
        ))}
      </div>

      <h2>Zones</h2>
      <table className="zone-list">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th className="right">Rooms</th>
            <th className="right">Range</th>
          </tr>
        </thead>
        <tbody>
          {world.index.zones.map((z) => (
            <tr key={z.id}>
              <td>{z.id}</td>
              <td>
                <Link to={`/zones/${z.id}`} className="xref">
                  {z.name}
                </Link>
              </td>
              <td className="right">{z.top - z.bottom + 1}</td>
              <td className="right muted">
                {z.bottom}–{z.top}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Focused view of a single scoped zone: scoped counts, its room range, a reset
// summary, and quick links. Cards carry ?zone= so the scope rides along.
function ZoneDashboard({ zoneId }: { zoneId: number }) {
  const { world } = useWorld();
  const zone = world.zones[zoneId];
  const scoped = world.index.countsByZone[zoneId] ?? { rooms: 0, mobs: 0, objects: 0, shops: 0 };
  const q = `?zone=${zoneId}`;
  const cards = [
    { label: "Rooms", n: scoped.rooms, to: `/rooms${q}` },
    { label: "Mobs", n: scoped.mobs, to: `/mobs${q}` },
    { label: "Objects", n: scoped.objects, to: `/objects${q}` },
    { label: "Shops", n: scoped.shops, to: `/shops${q}` },
  ];

  return (
    <div className="dashboard">
      <h1>
        {zone ? zone.name : `Zone ${zoneId}`} <span className="idtag">#{zoneId}</span>
        <ScopeBadge />
      </h1>
      {zone && (
        <p className="muted">
          Rooms {zone.bottom_room}–{zone.top_room} · lifespan {zone.lifespan} min ·{" "}
          {zone.mobs.length} mob resets · {zone.objects.length} object loads ·{" "}
          {zone.doors.length} door states
        </p>
      )}

      <div className="cards">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="card">
            <span className="card-n">{card.n.toLocaleString()}</span>
            <span className="card-label">{card.label}</span>
          </Link>
        ))}
      </div>

      <h2>This zone</h2>
      <ul className="link-list">
        <li>
          <Link to={`/zones/${zoneId}`} className="xref">
            → Full reset list &amp; zone detail
          </Link>
        </li>
        <li>
          <Link to={`/map?zone=${zoneId}`} className="xref">
            → View this zone on the map
          </Link>
        </li>
      </ul>
    </div>
  );
}
