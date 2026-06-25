import { Link } from "react-router";

export function NotFound({ kind, id }: { kind?: string; id?: string }) {
  return (
    <div className="notfound">
      <h1>Not found</h1>
      <p className="muted">
        {kind ? `No ${kind} with id ${id}.` : "That page does not exist."}
      </p>
      <Link to="/" className="xref">
        ← Back to dashboard
      </Link>
    </div>
  );
}
