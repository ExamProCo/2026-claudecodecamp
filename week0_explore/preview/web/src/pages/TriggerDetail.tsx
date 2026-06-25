import { useParams } from "react-router";
import { useWorld } from "../data/useWorld";
import { FlagList } from "../components/FlagList";
import { JsonView } from "../components/JsonView";
import { MobLink, ObjectLink, RoomLink } from "../components/links";
import { ZoneBreadcrumb } from "../components/ZoneBreadcrumb";
import type { TriggerAttachment } from "../data/relations";
import { NotFound } from "./NotFound";

function AttachmentLink({ attachment }: { attachment: TriggerAttachment }) {
  switch (attachment.kind) {
    case "mob":
      return <MobLink id={attachment.id} />;
    case "obj":
      return <ObjectLink id={attachment.id} />;
    default:
      return <RoomLink id={attachment.id} />;
  }
}

export function TriggerDetail() {
  const { id } = useParams();
  const { world, relations } = useWorld();
  const trigger = world.triggers[Number(id)];
  if (!trigger) return <NotFound kind="trigger" id={id} />;

  const attachments = relations.attachmentsOfTrigger(trigger.id);

  return (
    <article className="detail">
      <header>
        <h1>
          {trigger.name} <span className="idtag">#{trigger.id}</span>
        </h1>
        <div className="subhead">
          <ZoneBreadcrumb id={trigger.id} />
        </div>
      </header>

      <section>
        <h2>Metadata</h2>
        <dl className="stat-grid">
          <div>
            <dt>Attaches to</dt>
            <dd>{trigger.attach_type.note}</dd>
          </div>
          <div>
            <dt>Numeric arg</dt>
            <dd>{trigger.numeric_arg}</dd>
          </div>
          <div>
            <dt>Arglist</dt>
            <dd>{trigger.arglist || <span className="muted">none</span>}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2>Trigger types</h2>
        <FlagList flags={trigger.trigger_types} />
      </section>

      <section>
        <h2>Script</h2>
        {trigger.commands ? (
          <pre className="script">{trigger.commands}</pre>
        ) : (
          <p className="muted">Empty script body.</p>
        )}
      </section>

      <section>
        <h2>Attached to <span className="muted">({attachments.length})</span></h2>
        {attachments.length === 0 ? (
          <p className="muted">
            No mob, object, or room lists this trigger yet. (Attachment data lands with the
            tbaMUD-format parser fix.)
          </p>
        ) : (
          <ul className="link-list">
            {attachments.map((a, i) => (
              <li key={i}>
                <span className="muted small">{a.kind}: </span>
                <AttachmentLink attachment={a} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <JsonView data={trigger} />
    </article>
  );
}
