// Colors for room sector types, shared by the map nodes and the legend.
export const SECTOR_COLORS: Record<string, string> = {
  INSIDE: "#c9b48a",
  CITY: "#bdbdbd",
  FIELD: "#9bd17a",
  FOREST: "#5fa85f",
  HILLS: "#c2a86a",
  MOUNTAIN: "#a89a86",
  WATER_SWIM: "#7fb6e0",
  WATER_NOSWIM: "#4f8fc9",
  UNDERWATER: "#3a6fa0",
  FLYING: "#d7c7f0",
};

export const SECTORS = Object.keys(SECTOR_COLORS);
