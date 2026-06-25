// Zone-level connectivity graph: each of the world's zones is one node, and an
// edge means "a room in zone A has an exit into zone B." This is the whole-world
// overview the per-zone MapView can't give — click a zone to drop into its room
// map, click an edge to list the individual boundary crossings. Read-only; the
// links are derived client-side by Relations.zoneLinks() from existing exit data.
import { useMemo, useState } from "react";
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
import { getRelations, type ZoneLink } from "../data/relations";
import { RoomLink } from "../components/links";

const NODE_H = 52;
const NODE_W_MIN = 190;
const NODE_W_MAX = 270;

const ARROW = { type: "arrowclosed" as never };

function layout(nodes: Node[], edges: Edge[], widthOf: (id: string) => number) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  // LR ranks the 30 hubs into columns, which reads better than a tall TB stack
  // for a mesh this dense (plan §2 C3: revisit a force layout only if unreadable).
  g.setGraph({ rankdir: "LR", nodesep: 55, ranksep: 110 });
  for (const n of nodes) g.setNode(n.id, { width: widthOf(n.id), height: NODE_H });
  for (const e of edges) g.setEdge(e.source, e.target);
  dagre.layout(g);
  return nodes.map((n) => {
    const p = g.node(n.id);
    const w = widthOf(n.id);
    return {
      ...n,
      position: { x: p.x - w / 2, y: p.y - NODE_H / 2 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });
}

export function WorldMap() {
  const { world } = useWorld();
  const navigate = useNavigate();
  const { setScope } = useZoneScope();
  const relations = useMemo(() => getRelations(world), [world]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const zones = world.index.zones;

  const { nodes, edges, links } = useMemo(() => {
    const roomCount = (id: number) => world.index.countsByZone[String(id)]?.rooms ?? 0;
    const maxRooms = Math.max(1, ...zones.map((z) => roomCount(z.id)));

    // Node size + tint scale with room count so hub zones read as bigger/bolder.
    const widthFor = (id: number) =>
      NODE_W_MIN + (NODE_W_MAX - NODE_W_MIN) * (roomCount(id) / maxRooms);
    const widthOf = (nodeId: string) => widthFor(Number(nodeId));

    const nodes: Node[] = zones.map((z) => {
      const rooms = roomCount(z.id);
      const ratio = rooms / maxRooms;
      return {
        id: String(z.id),
        data: { label: `#${z.id} · ${z.name}\n${rooms} rooms` },
        position: { x: 0, y: 0 },
        style: {
          width: widthFor(z.id),
          height: NODE_H,
          fontSize: 11,
          whiteSpace: "pre-line",
          border: "1px solid #2c3340",
          borderRadius: 8,
          background: `hsl(214, ${32 + ratio * 38}%, ${58 - ratio * 12}%)`,
          color: "#0c0e12",
          textAlign: "center",
          padding: 4,
        },
      };
    });

    const links = relations.zoneLinks();
    const edges: Edge[] = links.map((link) => {
      const key = `${link.a}-${link.b}`;
      const allDoors = link.crossings.every((c) => c.door);
      const fromA = link.crossings.some((c) => c.fromZone === link.a);
      const fromB = link.crossings.some((c) => c.fromZone === link.b);
      const selected = key === selectedKey;
      const width = Math.min(1 + link.count / 3, 6);
      const stroke = selected ? "#7fb4ff" : allDoors ? "#d98c4a" : "#5a6374";
      return {
        id: key,
        source: String(link.a),
        target: String(link.b),
        label: String(link.count),
        style: {
          stroke,
          strokeWidth: selected ? width + 1 : width,
          ...(allDoors ? { strokeDasharray: "5 4" } : {}),
        },
        labelStyle: { fill: "#cdd3dd", fontSize: 11 },
        labelBgStyle: { fill: "#11141a" },
        // Arrowheads point in the direction(s) crossings actually flow. A one-way
        // link gets a single head; bidirectional links get both.
        markerEnd: fromA ? ARROW : undefined,
        markerStart: fromB ? ARROW : undefined,
      };
    });

    return { nodes: layout(nodes, edges, widthOf), edges, links };
  }, [world, zones, relations, selectedKey]);

  const selected = useMemo<ZoneLink | null>(
    () => links.find((l) => `${l.a}-${l.b}` === selectedKey) ?? null,
    [links, selectedKey],
  );

  const openZoneMap = (zoneId: number) => {
    setScope(zoneId);
    navigate("/map");
  };

  return (
    <div className="mapview">
      <div className="map-controls">
        <strong>World Map</strong>
        <span className="muted small">
          Each node is a zone; each edge is at least one room exit crossing the
          boundary. Click a zone to open its room map, an edge to list its crossings.
        </span>
      </div>
      <div className="legend">
        <span className="legend-item">
          <span className="swatch" style={{ background: "#5a6374" }} /> open crossing
        </span>
        <span className="legend-item">
          <span className="swatch door-swatch" /> door-only crossing
        </span>
        <span className="legend-item">→ one-way · ↔ two-way</span>
        <span className="legend-item">thicker / brighter node = more rooms</span>
      </div>
      <div className="map-canvas" style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            minZoom={0.1}
            onNodeClick={(_, node) => openZoneMap(Number(node.id))}
            onEdgeClick={(_, edge) =>
              setSelectedKey((k) => (k === edge.id ? null : edge.id))
            }
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
        {selected && (
          <aside className="xref-panel">
            <header className="xref-panel-head">
              <strong>
                Zone {selected.a} ↔ Zone {selected.b}
              </strong>
              <button className="xref-panel-close" onClick={() => setSelectedKey(null)}>
                ✕
              </button>
            </header>
            <p className="muted small">
              {selected.count} crossing{selected.count === 1 ? "" : "s"}
              {selected.bidirectional ? " · two-way" : " · one-way"}
            </p>
            <div className="xref-panel-actions">
              <button onClick={() => openZoneMap(selected.a)}>Open zone {selected.a} map</button>
              <button onClick={() => openZoneMap(selected.b)}>Open zone {selected.b} map</button>
            </div>
            <ul className="link-list">
              {selected.crossings.map((c, i) => (
                <li key={i}>
                  <RoomLink id={c.fromRoom} />{" "}
                  <span className="muted small">(zone {c.fromZone})</span>
                  <span className="muted"> —{DIR_SHORT[c.dir] ?? c.dir}{c.door ? " ⚷" : ""}→ </span>
                  <RoomLink id={c.toRoom} />{" "}
                  <span className="muted small">(zone {c.toZone})</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
