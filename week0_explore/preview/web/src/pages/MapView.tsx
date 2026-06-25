// Per-zone room map: rooms as nodes (colored by sector), exits as directed,
// labeled edges (closed/locked doors dashed). Layout via dagre. Click a room to
// open its detail. Exits leaving the zone become bounded "exit" stub nodes.
import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  Position,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { useWorld } from "../data/useWorld";
import { useZoneScope } from "../data/zoneScope";
import { DIR_SHORT } from "../data/types";
import { SECTOR_COLORS } from "../sectorColors";
import { SectorLegend } from "../components/SectorLegend";

const NODE_W = 180;
const NODE_H = 44;

function layout(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 40, ranksep: 70 });
  for (const n of nodes) g.setNode(n.id, { width: NODE_W, height: NODE_H });
  for (const e of edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    return {
      ...n,
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };
  });
}

export function MapView() {
  const { world } = useWorld();
  const navigate = useNavigate();
  // Bound to the global scope: picking a zone here sets it everywhere and vice-versa.
  // The map always needs a concrete zone, so "All zones" falls back to the first one
  // for display without forcing a scope.
  const { currentZone, setScope } = useZoneScope();
  const zones = world.index.zones;
  const selectedId = currentZone?.id ?? zones[0]?.id ?? 0;
  const zone = world.zones[selectedId];

  const { nodes, edges } = useMemo(() => {
    if (!zone) return { nodes: [] as Node[], edges: [] as Edge[] };

    const inZone = (rid: number) => rid >= zone.bottom_room && rid <= zone.top_room;
    const rooms = Object.values(world.rooms).filter((r) => inZone(r.id));

    const nodes: Node[] = rooms.map((r) => ({
      id: String(r.id),
      data: { label: `${r.name}\n#${r.id}` },
      position: { x: 0, y: 0 },
      style: {
        width: NODE_W,
        height: NODE_H,
        fontSize: 11,
        whiteSpace: "pre-line",
        border: "1px solid #2c3340",
        borderRadius: 6,
        background: SECTOR_COLORS[r.sector_type.note] ?? "#3a4150",
        color: "#0c0e12",
        textAlign: "center",
      },
    }));

    const stubs = new Map<string, Node>();
    const edges: Edge[] = [];

    for (const r of rooms) {
      for (const ex of r.exits) {
        if (ex.room_linked < 0) continue;
        let targetId = String(ex.room_linked);
        if (!inZone(ex.room_linked)) {
          // bounded stub for out-of-zone exits
          const tz = world.rooms[ex.room_linked]?.zone_number;
          targetId = `ext-${ex.room_linked}`;
          if (!stubs.has(targetId)) {
            stubs.set(targetId, {
              id: targetId,
              data: {
                label: `→ #${ex.room_linked}${tz != null ? `\nopen zone ${tz} map` : ""}`,
                targetZone: tz,
              },
              position: { x: 0, y: 0 },
              style: {
                width: NODE_W,
                height: NODE_H,
                fontSize: 10,
                whiteSpace: "pre-line",
                border: "1px dashed #555c6a",
                borderRadius: 6,
                background: "#1a1d24",
                color: "#9aa3b2",
                textAlign: "center",
              },
            });
          }
        }
        const closed = ex.door_flag.note !== "NO_DOOR";
        edges.push({
          id: `${r.id}-${ex.dir}-${ex.room_linked}`,
          source: String(r.id),
          target: targetId,
          label: DIR_SHORT[ex.dir] ?? String(ex.dir),
          animated: false,
          style: closed
            ? { stroke: "#d98c4a", strokeDasharray: "5 4" }
            : { stroke: "#5a6374" },
          labelStyle: { fill: "#cdd3dd", fontSize: 10 },
          markerEnd: { type: "arrowclosed" as never },
        });
      }
    }

    const all = [...nodes, ...stubs.values()];
    return { nodes: layout(all, edges), edges };
  }, [zone, world]);

  return (
    <div className="mapview">
      <div className="map-controls">
        <label>
          Zone:{" "}
          <select
            value={selectedId}
            onChange={(e) => setScope(Number(e.target.value))}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                #{z.id} — {z.name} ({z.top - z.bottom + 1} rooms)
              </option>
            ))}
          </select>
        </label>
        <span className="muted small">
          Click a room to open its detail, or a dashed exit stub to walk into the
          neighboring zone's map. Dashed orange edges are doors.
        </span>
      </div>
      <SectorLegend />
      <div className="map-canvas">
        {nodes.length === 0 ? (
          <p className="muted" style={{ padding: 16 }}>
            No rooms found in this zone's range.
          </p>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            minZoom={0.1}
            onNodeClick={(_, node) => {
              if (!node.id.startsWith("ext-")) {
                navigate(`/rooms/${node.id}`);
                return;
              }
              // Stub: drill into the neighbor zone's map when we know it, so you
              // can walk zone-to-zone; fall back to the target room otherwise.
              const tz = (node.data as { targetZone?: number }).targetZone;
              if (tz != null) setScope(tz);
              else navigate(`/rooms/${node.id.replace("ext-", "")}`);
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
