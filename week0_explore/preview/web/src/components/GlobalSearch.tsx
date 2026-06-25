// Global search across all entity types, driven by the index summary. When a zone
// scope is active, results are restricted to that zone by default — with a clearly
// labeled "search all zones" escape hatch so searching never hides a real match.
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";

interface Hit {
  kind: string;
  path: string;
  id: number;
  name: string;
}

// List entries carry their owning zone (rooms/mobs/objects/shops); zones do not and
// are never scoped (the Zones list is the scope navigator).
type SearchEntry = { id: number; name: string; zone?: number | null };

export function GlobalSearch() {
  const { world } = useWorld();
  const { currentZone } = useZoneScope();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [searchAll, setSearchAll] = useState(false);

  // The zone results are restricted to, or null when unscoped / escape hatch is on.
  const activeZone = searchAll ? null : currentZone;

  const hits = useMemo<Hit[]>(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out: Hit[] = [];
    const push = (kind: string, path: string, list: SearchEntry[], scoped = true) => {
      for (const e of list) {
        if (out.length >= 50) return;
        if (scoped && activeZone && e.zone !== activeZone.id) continue;
        if (`${e.name} ${e.id}`.toLowerCase().includes(query)) {
          out.push({ kind, path, id: e.id, name: e.name });
        }
      }
    };
    push("room", "rooms", world.index.rooms);
    push("mob", "mobs", world.index.mobs);
    push("object", "objects", world.index.objects);
    push("zone", "zones", world.index.zones, false);
    push("shop", "shops", world.index.shops);
    push("trigger", "triggers", world.index.triggers);
    push("quest", "quests", world.index.quests);
    return out;
  }, [q, world, activeZone]);

  function go(hit: Hit) {
    navigate(`/${hit.path}/${hit.id}`);
    setQ("");
    setFocused(false);
  }

  const open = focused && q.trim().length >= 2;

  return (
    <div className="global-search">
      <input
        type="search"
        placeholder={activeZone ? `Search zone ${activeZone.id}…` : "Search all entities…"}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hits[0]) go(hits[0]);
          if (e.key === "Escape") setQ("");
        }}
      />
      {open && (
        <ul className="search-results">
          {currentZone && (
            <li className="search-scope-note">
              <span className="muted small">
                {searchAll
                  ? "Searching all zones"
                  : `Limited to zone ${currentZone.id} · ${currentZone.name}`}
              </span>
              <button
                type="button"
                className="link-button"
                // onMouseDown so it fires before the input's blur closes the dropdown
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchAll((v) => !v);
                }}
              >
                {searchAll ? "limit to scope" : "search all zones"}
              </button>
            </li>
          )}
          {hits.length === 0 ? (
            <li className="search-empty muted small">No matches.</li>
          ) : (
            hits.map((h) => (
              <li key={`${h.kind}-${h.id}`} onMouseDown={() => go(h)}>
                <span className={`kind kind-${h.kind}`}>{h.kind}</span>
                <span className="hit-name">{h.name}</span>
                <span className="idtag">#{h.id}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
