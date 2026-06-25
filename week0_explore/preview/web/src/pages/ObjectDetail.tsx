import { useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import { FlagList } from "../components/FlagList";
import { JsonView } from "../components/JsonView";
import { MobLink, RoomLink, ShopLink, ZoneLink } from "../components/links";
import { ZoneBreadcrumb } from "../components/ZoneBreadcrumb";
import { NotFound } from "./NotFound";

export function ObjectDetail() {
  const { id } = useParams();
  const { world, relations } = useWorld();
  const obj = world.objects[Number(id)];
  if (!obj) return <NotFound kind="object" id={id} />;

  const loads = relations.loadsForObject(obj.id);
  const shops = relations.shopsSellingObject(obj.id);

  const stats: [string, string | number][] = [
    ["Type", obj.type.note],
    ["Cost", obj.cost],
    ["Rent", obj.rent],
    ["Weight", obj.weight],
  ];

  return (
    <article className="detail">
      <header>
        <h1>
          {obj.short_desc} <span className="idtag">#{obj.id}</span>
        </h1>
        <div className="subhead">
          <span className="muted">{obj.aliases.join(", ")}</span>
          <ZoneBreadcrumb id={obj.id} />
        </div>
      </header>

      <section>
        <p className="desc">{obj.long_desc}</p>
        {obj.action_desc && <p className="desc muted">{obj.action_desc}</p>}
      </section>

      <section>
        <h2>Properties</h2>
        <dl className="stat-grid">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Values</h2>
        <code className="values">[{obj.values.join(", ")}]</code>
        <p className="muted small">Type-specific (see CircleMUD docs for {obj.type.note}).</p>
      </section>

      <section>
        <h2>Wear slots</h2>
        <FlagList flags={obj.wear} />
      </section>

      <section>
        <h2>Effects</h2>
        <FlagList flags={obj.effects} />
      </section>

      <section>
        <h2>Affects</h2>
        <FlagList flags={obj.affects} />
      </section>

      <section>
        <h2>Loaded by</h2>
        {loads.length === 0 ? (
          <p className="muted">No zone reset loads this object.</p>
        ) : (
          <ul className="link-list">
            {loads.map((l, i) => (
              <li key={i}>
                <ZoneLink id={l.zoneId} /> →{" "}
                {l.via === "room" ? (
                  <>
                    in <RoomLink id={l.room} />
                  </>
                ) : (
                  <>
                    {l.via} of <MobLink id={l.mob!} /> @ <RoomLink id={l.room} />
                  </>
                )}{" "}
                <span className="muted">(max {l.max})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {shops.length > 0 && (
        <section>
          <h2>Sold by</h2>
          <ul className="link-list">
            {shops.map((s) => (
              <li key={s}>
                <ShopLink id={s} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {obj.extra_descs.length > 0 && (
        <section>
          <h2>Extra descriptions</h2>
          {obj.extra_descs.map((ed, i) => (
            <div key={i} className="extra-desc">
              <strong>{ed.keywords.join(", ")}</strong>
              <p>{ed.desc}</p>
            </div>
          ))}
        </section>
      )}

      <JsonView data={obj} />
    </article>
  );
}
