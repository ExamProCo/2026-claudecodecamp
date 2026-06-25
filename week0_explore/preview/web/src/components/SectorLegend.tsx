// Color key for room sector types, shown alongside the map.
import { SECTOR_COLORS } from "../sectorColors";

export function SectorLegend() {
  return (
    <div className="legend">
      {Object.entries(SECTOR_COLORS).map(([name, color]) => (
        <span key={name} className="legend-item">
          <span className="swatch" style={{ background: color }} />
          {name}
        </span>
      ))}
      <span className="legend-item">
        <span className="swatch door-swatch" />
        door
      </span>
    </div>
  );
}
