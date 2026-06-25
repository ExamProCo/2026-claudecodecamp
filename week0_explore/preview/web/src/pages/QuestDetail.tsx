import { Fragment } from "react";
import { useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import { FlagList } from "../components/FlagList";
import { JsonView } from "../components/JsonView";
import { MobLink, ObjectLink, QuestLink, RoomLink } from "../components/links";
import { ZoneBreadcrumb } from "../components/ZoneBreadcrumb";
import { NotFound } from "./NotFound";

// The objective target's vnum is interpreted per quest type: kill/find/save a
// mob, find/return an object, or reach/clear a room.
function ObjectiveTarget({ typeNote, target }: { typeNote: string | null; target: number }) {
  if (target < 0) return <span className="muted">none</span>;
  switch (typeNote) {
    case "OBJ_FIND":
    case "OBJ_RETURN":
      return <ObjectLink id={target} />;
    case "ROOM_FIND":
    case "ROOM_CLEAR":
      return <RoomLink id={target} />;
    default:
      // MOB_FIND / MOB_KILL / MOB_SAVE (and anything unrecognised).
      return <MobLink id={target} />;
  }
}

export function QuestDetail() {
  const { id } = useParams();
  const { world, relations } = useWorld();
  const quest = world.quests[Number(id)];
  if (!quest) return <NotFound kind="quest" id={id} />;

  const chain = relations.questChain(quest.id);
  const messages: [string, string][] = [
    ["Offer", quest.messages.offer],
    ["Info", quest.messages.info],
    ["Completion", quest.messages.done],
    ["Abandon", quest.messages.quit],
  ];

  return (
    <article className="detail">
      <header>
        <h1>
          {quest.name} <span className="idtag">#{quest.id}</span>
        </h1>
        <div className="subhead">
          <span className="muted">{quest.type.note ?? `type ${quest.type.value}`}</span>
          <ZoneBreadcrumb id={quest.id} />
        </div>
      </header>

      <section>
        <h2>Objective</h2>
        <dl className="stat-grid">
          <div>
            <dt>Type</dt>
            <dd>{quest.type.note ?? `type ${quest.type.value}`}</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>
              <ObjectiveTarget typeNote={quest.type.note} target={quest.target} />
            </dd>
          </div>
          <div>
            <dt>Questmaster</dt>
            <dd>{quest.questmaster >= 0 ? <MobLink id={quest.questmaster} /> : <span className="muted">none</span>}</dd>
          </div>
          <div>
            <dt>Prerequisite</dt>
            <dd>{quest.prereq >= 0 ? <ObjectLink id={quest.prereq} /> : <span className="muted">none</span>}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Rewards</h2>
        <dl className="stat-grid">
          <div>
            <dt>Gold</dt>
            <dd>{quest.rewards.gold}</dd>
          </div>
          <div>
            <dt>Experience</dt>
            <dd>{quest.rewards.exp}</dd>
          </div>
          <div>
            <dt>Object</dt>
            <dd>{quest.rewards.obj >= 0 ? <ObjectLink id={quest.rewards.obj} /> : <span className="muted">none</span>}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Messages</h2>
        <dl className="msg-grid">
          {messages.map(([k, v]) => (
            <div key={k}>
              <dt className="muted small">{k}</dt>
              <dd>{v ? <span className="desc">{v}</span> : <span className="muted">none</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Flags</h2>
        <FlagList flags={quest.flags} />
      </section>

      <section>
        <h2>Chain</h2>
        {chain.length <= 1 ? (
          <p className="muted">Standalone quest (no prev/next links).</p>
        ) : (
          <p className="quest-chain">
            {chain.map((qid, i) => (
              <Fragment key={qid}>
                {i > 0 && <span className="muted"> → </span>}
                {qid === quest.id ? <strong>{quest.name} #{quest.id}</strong> : <QuestLink id={qid} />}
              </Fragment>
            ))}
          </p>
        )}
      </section>

      <JsonView data={quest} />
    </article>
  );
}
