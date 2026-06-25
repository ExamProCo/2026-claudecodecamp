import { useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import { DIRECTIONS } from "../data/types";
import { FlagList } from "../components/FlagList";
import { JsonView } from "../components/JsonView";
import { MobLink, ObjectLink, RoomLink, ShopLink, ZoneLink } from "../components/links";
import { NotFound } from "./NotFound";

export function RoomDetail() {
  const { id } = useParams();
  const { world, relations } = useWorld();
  const room = world.rooms[Number(id)];
  if (!room) return <NotFound kind="room" id={id} />;

  const zone = relations.zoneForRoom(room.id);
  const inbound = relations.inboundExits(room.id);
  const contents = relations.contentsOfRoom(room.id);
  const shops = relations.shopsInRoom(room.id);

  return (
    <article className="detail">
      <header>
        <h1>
          {room.name} <span className="idtag">#{room.id}</span>
        </h1>
        <div className="subhead">
          <FlagList flags={[room.sector_type]} />
          {zone && (
            <span>
              in zone <ZoneLink id={zone.id} />
            </span>
          )}
        </div>
      </header>

      <section>
        <p className="desc">{room.desc}</p>
      </section>

      <section>
        <h2>Flags</h2>
        <FlagList flags={room.flags} />
      </section>

      <section>
        <h2>Exits</h2>
        {room.exits.length === 0 ? (
          <p className="muted">No exits.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Dir</th>
                <th>To</th>
                <th>Door</th>
                <th>Key</th>
                <th>Keywords</th>
              </tr>
            </thead>
            <tbody>
              {room.exits.map((ex, i) => (
                <tr key={i}>
                  <td>{DIRECTIONS[ex.dir] ?? ex.dir}</td>
                  <td>
                    <RoomLink id={ex.room_linked} />
                  </td>
                  <td>
                    {ex.door_flag.note === "NO_DOOR" ? (
                      <span className="muted">—</span>
                    ) : (
                      <FlagList flags={[ex.door_flag]} />
                    )}
                  </td>
                  <td>{ex.key_number >= 0 ? <ObjectLink id={ex.key_number} /> : <span className="muted">—</span>}</td>
                  <td className="muted">{ex.keywords.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2>Inbound exits <span className="muted">({inbound.length})</span></h2>
        {inbound.length === 0 ? (
          <p className="muted">Nothing exits into this room.</p>
        ) : (
          <ul className="link-list">
            {inbound.map((e, i) => (
              <li key={i}>
                <RoomLink id={e.fromRoom} /> <span className="muted">({DIRECTIONS[e.dir] ?? e.dir})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Spawns / loads here</h2>
        {contents.mobs.length === 0 && contents.objects.length === 0 ? (
          <p className="muted">No resets target this room.</p>
        ) : (
          <>
            {contents.mobs.length > 0 && (
              <>
                <h3>Mobs</h3>
                <ul className="link-list">
                  {contents.mobs.map((m, i) => (
                    <li key={i}>
                      <MobLink id={m.mob} /> <span className="muted">(max {m.max})</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {contents.objects.length > 0 && (
              <>
                <h3>Objects</h3>
                <ul className="link-list">
                  {contents.objects.map((o, i) => (
                    <li key={i}>
                      <ObjectLink id={o.objId} /> <span className="muted">(max {o.max})</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      {shops.length > 0 && (
        <section>
          <h2>Shops here</h2>
          <ul className="link-list">
            {shops.map((s) => (
              <li key={s}>
                <ShopLink id={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {room.extra_descs.length > 0 && (
        <section>
          <h2>Extra descriptions</h2>
          {room.extra_descs.map((ed, i) => (
            <div key={i} className="extra-desc">
              <strong>{ed.keywords.join(", ")}</strong>
              <p>{ed.desc}</p>
            </div>
          ))}
        </section>
      )}

      <JsonView data={room} />
    </article>
  );
}
