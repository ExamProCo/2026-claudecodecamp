// Collapsible raw-JSON view for ground-truth inspection on every detail page.
import { useState } from "react";

export function JsonView({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="jsonview">
      <button className="toggle" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} Raw JSON
      </button>
      {open && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
