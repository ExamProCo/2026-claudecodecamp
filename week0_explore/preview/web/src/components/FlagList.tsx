// Renders decoded bitvector flags (the parser's { note, value } pairs) as chips.
import type { NoteValue } from "../data/types";

export function FlagList({ flags, empty = "none" }: { flags: NoteValue[]; empty?: string }) {
  if (!flags || flags.length === 0) return <span className="muted">{empty}</span>;
  return (
    <span className="flags">
      {flags.map((f) => (
        <span key={f.note} className="flag" title={`value ${f.value}`}>
          {f.note}
        </span>
      ))}
    </span>
  );
}
