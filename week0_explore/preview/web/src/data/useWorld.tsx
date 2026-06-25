// Loads the whole world once and exposes it (plus memoized Relations) via context.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { loadWorld, type World } from "./load";
import { getRelations, Relations } from "./relations";

interface WorldState {
  world: World;
  relations: Relations;
}

const WorldContext = createContext<WorldState | null>(null);

export function WorldProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorldState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadWorld()
      .then((world) => {
        if (!cancelled) setState({ world, relations: getRelations(world) });
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="loading error">
        <h2>Failed to load world data</h2>
        <p>{error}</p>
        <p>
          Did the data bundles get built? Run <code>npm run build:data</code> in{" "}
          <code>preview/web</code>.
        </p>
      </div>
    );
  }

  if (!state) {
    return <div className="loading">Loading world data…</div>;
  }

  return <WorldContext.Provider value={state}>{children}</WorldContext.Provider>;
}

export function useWorld(): WorldState {
  const ctx = useContext(WorldContext);
  if (!ctx) throw new Error("useWorld must be used within a WorldProvider");
  return ctx;
}
