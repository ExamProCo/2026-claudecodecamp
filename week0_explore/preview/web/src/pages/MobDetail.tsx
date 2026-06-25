import { useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import type { Dice } from "../data/types";
import { FlagList } from "../components/FlagList";
import { JsonView } from "../components/JsonView";
import { ObjectLink, RoomLink, ShopLink, ZoneLink } from "../components/links";
import { ZoneBreadcrumb } from "../components/ZoneBreadcrumb";
import { NotFound } from "./NotFound";

function dice(d: Dice) {
  return `${d.dice}d${d.sides}${d.bonus ? `+${d.bonus}` : ""}`;
}

export function MobDetail() {
  const { id } = useParams();
  const { world, relations } = useWorld();
  const mob = world.mobs[Number(id)];
  if (!mob) return <NotFound kind="mob" id={id} />;

  const spawns = relations.spawnsForMob(mob.id);
  const keeperOf = relations.shopsForKeeper(mob.id);

  const stats: [string, string | number][] = [
    ["Level", mob.level],
    ["Alignment", mob.alignment],
    ["Armor class", mob.armor_class],
    ["THAC0", mob.thac0],
    ["Hit points", dice(mob.max_hit_points)],
    ["Bare-hand dmg", dice(mob.bare_hand_damage)],
    ["Gold", mob.gold],
    ["XP", mob.xp],
    ["Gender", mob.gender.note],
    ["Type", mob.mob_type],
    ["Position", mob.position.default.note.replace("POSITION_", "")],
  ];

  return (
    <article className="detail">
      <header>
        <h1>
          {mob.short_desc} <span className="idtag">#{mob.id}</span>
        </h1>
        <div className="subhead">
          <span className="muted">{mob.aliases.join(", ")}</span>
          <ZoneBreadcrumb id={mob.id} />
        </div>
      </header>

      <section>
        <p className="desc">{mob.long_desc}</p>
        {mob.detail_desc && <p className="desc muted">{mob.detail_desc}</p>}
      </section>

      <section>
        <h2>Stats</h2>
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
        <h2>Flags</h2>
        <FlagList flags={mob.flags} />
      </section>

      <section>
        <h2>Affects</h2>
        <FlagList flags={mob.affects} />
      </section>

      <section>
        <h2>Spawned by</h2>
        {spawns.length === 0 ? (
          <p className="muted">No zone reset spawns this mob.</p>
        ) : (
          <ul className="link-list">
            {spawns.map((s, i) => (
              <li key={i}>
                <ZoneLink id={s.zoneId} /> → <RoomLink id={s.room} />{" "}
                <span className="muted">(max {s.max})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {keeperOf.length > 0 && (
        <section>
          <h2>Shopkeeper of</h2>
          <ul className="link-list">
            {keeperOf.map((s) => {
              const shop = world.shops[s];
              return (
                <li key={s}>
                  <ShopLink id={s} /> — sells{" "}
                  {shop.objects.slice(0, 5).map((o) => (
                    <span key={o} style={{ marginRight: 8 }}>
                      <ObjectLink id={o} />
                    </span>
                  ))}
                  {shop.objects.length > 5 && <span className="muted">+{shop.objects.length - 5} more</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <JsonView data={mob} />
    </article>
  );
}
