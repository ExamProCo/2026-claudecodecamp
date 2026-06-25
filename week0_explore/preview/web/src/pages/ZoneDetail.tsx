import { Link, useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import { DIRECTIONS, type ZoneItem } from "../data/types";
import { getRelations } from "../data/relations";
import { JsonView } from "../components/JsonView";
import { MobLink, ObjectLink, RoomLink, ZoneLink } from "../components/links";
import { NotFound } from "./NotFound";

const RESET_MODES: Record<number, string> = {
  0: "Never reset",
  1: "Reset when empty of players",
  2: "Always reset",
};

function ItemList({ items, label }: { items: ZoneItem[]; label: string }) {
  if (items.length === 0) return null;
  return (
    <div className="item-sublist">
      <span className="muted small">{label}:</span>{" "}
      {items.map((it, i) => (
        <span key={i} style={{ marginRight: 8 }}>
          <ObjectLink id={it.id} />
          {it.note ? <span className="muted small"> ({it.note})</span> : null}
        </span>
      ))}
    </div>
  );
}

export function ZoneDetail() {
  const { id } = useParams();
  const { world } = useWorld();
  const zone = world.zones[Number(id)];
  if (!zone) return <NotFound kind="zone" id={id} />;

  // Neighboring zones, derived from boundary-crossing room exits (plan 02 §5.2).
  const links = getRelations(world).zoneLinksFor(zone.id);

  return (
    <article className="detail">
      <header>
        <h1>
          {zone.name} <span className="idtag">#{zone.id}</span>
        </h1>
        <div className="subhead muted">
          rooms {zone.bottom_room}–{zone.top_room} · lifespan {zone.lifespan} min ·{" "}
          {RESET_MODES[zone.reset_mode] ?? `mode ${zone.reset_mode}`}
        </div>
      </header>

      <section>
        <h2>Mob spawns <span className="muted">({zone.mobs.length})</span></h2>
        {zone.mobs.length === 0 ? (
          <p className="muted">None.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mob</th>
                <th>Room</th>
                <th>Max</th>
                <th>Carries</th>
              </tr>
            </thead>
            <tbody>
              {zone.mobs.map((m, i) => (
                <tr key={i}>
                  <td><MobLink id={m.mob} /></td>
                  <td><RoomLink id={m.room} /></td>
                  <td>{m.max}</td>
                  <td>
                    <ItemList items={m.equipped} label="equipped" />
                    <ItemList items={m.inventory} label="inventory" />
                    {m.equipped.length === 0 && m.inventory.length === 0 && (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Object loads <span className="muted">({zone.objects.length})</span></h2>
        {zone.objects.length === 0 ? (
          <p className="muted">None.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Object</th>
                <th>Room</th>
                <th>Max</th>
                <th>Contains</th>
              </tr>
            </thead>
            <tbody>
              {zone.objects.map((o, i) => (
                <tr key={i}>
                  <td><ObjectLink id={o.id} /></td>
                  <td><RoomLink id={o.room} /></td>
                  <td>{o.max}</td>
                  <td>
                    {o.contents.length > 0 ? (
                      <ItemList items={o.contents} label="contents" />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {zone.doors.length > 0 && (
        <section>
          <h2>Door states <span className="muted">({zone.doors.length})</span></h2>
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Direction</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {zone.doors.map((d, i) => (
                <tr key={i}>
                  <td><RoomLink id={d.room} /></td>
                  <td>{DIRECTIONS[d.exit] ?? d.exit}</td>
                  <td>{["open", "closed", "closed+locked"][d.state] ?? `state ${d.state}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {zone.remove_objects.length > 0 && (
        <section>
          <h2>Removed objects <span className="muted">({zone.remove_objects.length})</span></h2>
          <ul className="link-list">
            {zone.remove_objects.map((r, i) => (
              <li key={i}>
                <ObjectLink id={r.id} /> from <RoomLink id={r.room} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2>Connects to <span className="muted">({links.length})</span></h2>
        {links.length === 0 ? (
          <p className="muted">No exits cross this zone's boundary.</p>
        ) : (
          <ul className="link-list">
            {links.map((link) => {
              const neighbor = link.a === zone.id ? link.b : link.a;
              const out = link.crossings.filter((c) => c.fromZone === zone.id).length;
              const inbound = link.count - out;
              return (
                <li key={neighbor}>
                  <ZoneLink id={neighbor} />{" "}
                  <span className="muted small">
                    — {out} exit{out === 1 ? "" : "s"} out, {inbound} in
                    {link.bidirectional ? "" : " · one-way"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <Link to={`/map?zone=${zone.id}`} className="xref">
          → View this zone on the map
        </Link>
        {" · "}
        <Link to="/world-map" className="xref">
          → View the world connectivity map
        </Link>
      </section>

      <JsonView data={zone} />
    </article>
  );
}
