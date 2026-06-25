import { useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import { JsonView } from "../components/JsonView";
import { MobLink, ObjectLink, RoomLink } from "../components/links";
import { ZoneBreadcrumb } from "../components/ZoneBreadcrumb";
import { NotFound } from "./NotFound";

export function ShopDetail() {
  const { id } = useParams();
  const { world } = useWorld();
  const shop = world.shops[Number(id)];
  if (!shop) return <NotFound kind="shop" id={id} />;

  return (
    <article className="detail">
      <header>
        <h1>
          Shop <span className="idtag">#{shop.id}</span>
        </h1>
        <div className="subhead">
          <span>kept by <MobLink id={shop.shopkeeper} /></span>
          <ZoneBreadcrumb id={shop.id} />
        </div>
      </header>

      <section>
        <h2>Rates</h2>
        <dl className="stat-grid">
          <div>
            <dt>Buy multiplier</dt>
            <dd>{shop.buy_rate}× <span className="muted small">(player pays)</span></dd>
          </div>
          <div>
            <dt>Sell multiplier</dt>
            <dd>{shop.sell_rate}× <span className="muted small">(player receives)</span></dd>
          </div>
          <div>
            <dt>Temper</dt>
            <dd>{shop.temper}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Products <span className="muted">({shop.objects.length})</span></h2>
        {shop.objects.length === 0 ? (
          <p className="muted">None.</p>
        ) : (
          <ul className="link-list">
            {shop.objects.map((o) => (
              <li key={o}>
                <ObjectLink id={o} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Located in</h2>
        <ul className="link-list">
          {shop.rooms.map((r) => (
            <li key={r}>
              <RoomLink id={r} />
            </li>
          ))}
        </ul>
      </section>

      {shop.buy_types.length > 0 && (
        <section>
          <h2>Buys types</h2>
          <span className="flags">
            {shop.buy_types.map((t, i) => (
              <span key={i} className="flag">
                {t.note}
                {t.namelist ? `: ${t.namelist}` : ""}
              </span>
            ))}
          </span>
        </section>
      )}

      <section>
        <h2>Hours</h2>
        <ul className="link-list">
          {shop.times.map((t, i) => (
            <li key={i} className="muted">
              {t.open}:00–{t.close}:00
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Messages</h2>
        <dl className="msg-grid">
          {Object.entries(shop.messages).map(([k, v]) => (
            <div key={k}>
              <dt className="muted small">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <JsonView data={shop} />
    </article>
  );
}
