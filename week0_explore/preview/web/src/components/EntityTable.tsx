// Generic sortable + text-filterable table used by every list view.
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";

export interface Column<T> {
  key: string;
  header: string;
  // value used for sorting + default text search
  value: (row: T) => string | number;
  // optional custom cell renderer (defaults to the sort value)
  render?: (row: T) => ReactNode;
  align?: "left" | "right";
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  // navigate here on row click
  hrefFor?: (row: T) => string;
  // extra text included in the search match (e.g. aliases)
  searchText?: (row: T) => string;
  initialSort?: string;
}

export function EntityTable<T>({
  rows,
  columns,
  rowKey,
  hrefFor,
  searchText,
  initialSort,
}: Props<T>) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(initialSort ?? columns[0].key);
  const [asc, setAsc] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const base = columns.map((c) => String(c.value(r))).join(" ");
      const extra = searchText ? searchText(r) : "";
      return (base + " " + extra).toLowerCase().includes(q);
    });
  }, [rows, columns, query, searchText]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey) ?? columns[0];
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return asc ? cmp : -cmp;
    });
    return copy;
  }, [filtered, columns, sortKey, asc]);

  function onSort(key: string) {
    if (key === sortKey) setAsc((a) => !a);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  return (
    <div className="entity-table">
      <div className="table-controls">
        <input
          type="search"
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="muted">
          {sorted.length} of {rows.length}
        </span>
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                onClick={() => onSort(c.key)}
                className={`sortable ${c.align === "right" ? "right" : ""}`}
              >
                {c.header}
                {sortKey === c.key ? (asc ? " ▲" : " ▼") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr
              key={rowKey(r)}
              className={hrefFor ? "clickable" : ""}
              onClick={hrefFor ? () => navigate(hrefFor(r)) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={c.align === "right" ? "right" : ""}>
                  {c.render ? c.render(r) : c.value(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
