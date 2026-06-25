// Global zone scope: the whole app can be filtered to one zone at a time, with an
// explicit "All zones" mode that preserves the original flat behavior.
//
// Ownership is by vnum range (CircleMUD's own definition): an entity belongs to the
// single zone whose bottom_room..top_room block contains its id. Because zone ranges
// are non-overlapping, `inScope(id)` for a selected zone is just a range check — O(1),
// no per-id lookup table needed.
//
// Source of truth is the URL query param `?zone=` (shareable / bookmarkable), mirrored
// to localStorage so a param-less visit restores the last choice. URL wins when present.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useSearchParams } from "react-router";
import { useWorld } from "./useWorld";
import type { ZoneIndexEntry } from "./types";

export type ScopeId = number | "all";

export interface Scope {
  zoneId: ScopeId;
}

interface ZoneScopeValue {
  scope: Scope;
  /** The selected zone's index entry, or null in "All zones" mode. */
  currentZone: ZoneIndexEntry | null;
  setScope: (zoneId: ScopeId) => void;
  /** O(1) predicate every list/search uses; true for everything in "All zones". */
  inScope: (id: number) => boolean;
}

const STORAGE_KEY = "worldPreview.zoneScope";
const ZoneScopeContext = createContext<ZoneScopeValue | null>(null);

function readStored(): ScopeId {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s || s === "all") return "all";
    const n = Number(s);
    return Number.isFinite(n) ? n : "all";
  } catch {
    return "all";
  }
}

function persist(zoneId: ScopeId) {
  try {
    localStorage.setItem(STORAGE_KEY, zoneId === "all" ? "all" : String(zoneId));
  } catch {
    /* ignore quota / disabled storage */
  }
}

export function ZoneScopeProvider({ children }: { children: ReactNode }) {
  const { world } = useWorld();
  const [params, setParams] = useSearchParams();

  // Zone ranges, indexed by id, for validation + the inScope range check.
  const zonesById = useMemo(() => {
    const m = new Map<number, ZoneIndexEntry>();
    for (const z of world.index.zones) m.set(z.id, z);
    return m;
  }, [world]);

  // Resolve the effective scope: URL param wins; otherwise the last persisted choice.
  // A numeric id that no longer matches any zone degrades to "all" so a stale value
  // never hides the entire world.
  const zoneId = useMemo<ScopeId>(() => {
    const param = params.get("zone");
    const candidate: ScopeId =
      param !== null
        ? param === "all"
          ? "all"
          : Number.isFinite(Number(param))
            ? Number(param)
            : "all"
        : readStored();
    if (candidate !== "all" && !zonesById.has(candidate)) return "all";
    return candidate;
  }, [params, zonesById]);

  // Mirror the effective scope to localStorage (covers arriving via a `?zone=` link).
  useEffect(() => {
    persist(zoneId);
  }, [zoneId]);

  const setScope = useCallback(
    (next: ScopeId) => {
      persist(next);
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === "all") p.delete("zone");
          else p.set("zone", String(next));
          return p;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  const currentZone = zoneId === "all" ? null : zonesById.get(zoneId) ?? null;

  const inScope = useCallback(
    (id: number) => {
      if (!currentZone) return true; // "All zones" (or unknown) -> nothing filtered
      return id >= currentZone.bottom && id <= currentZone.top;
    },
    [currentZone],
  );

  const value = useMemo<ZoneScopeValue>(
    () => ({ scope: { zoneId }, currentZone, setScope, inScope }),
    [zoneId, currentZone, setScope, inScope],
  );

  return <ZoneScopeContext.Provider value={value}>{children}</ZoneScopeContext.Provider>;
}

export function useZoneScope(): ZoneScopeValue {
  const ctx = useContext(ZoneScopeContext);
  if (!ctx) throw new Error("useZoneScope must be used within a ZoneScopeProvider");
  return ctx;
}
