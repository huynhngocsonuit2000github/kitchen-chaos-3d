export const layout = [
  '############',
  '#BPMCLG.|..#',
  '#.......|T.#',
  '#K.....S...#',
  '#.......|..#',
  '#W.A....|T.#',
  '#.......|..#',
  '#R......|..#',
  '#X12....|.D#',
  '############',
];

export const stationNames = {
  B: 'Bun bin', P: 'Patty bin', M: 'Tomato bin', C: 'Cheese bin', L: 'Lettuce bin',
  G: 'Stove', K: 'Prep board', S: 'Serving hatch', W: 'Sink', A: 'Assembly',
  R: 'Plate rack', X: 'Waste bin', K2: 'Second prep board', G2: 'Second stove',
};
export type StationId = keyof typeof stationNames;
export type Point = { x: number; z: number };
export const cells = layout.flatMap((row, z) => Array.from(row, (tile, x) => ({ tile, x, z })));
export const stations = cells.filter((cell): cell is Point & { tile: StationId } =>
  Object.hasOwn(stationNames, cell.tile));
export const isSolid = (tile: string) => !'.12D'.includes(tile);

export function routeTo(from: Point, to: Point, blocked: ReadonlySet<string>) {
  const start = { x: Math.round(from.x), z: Math.round(from.z) };
  const queue: { cell: Point; path: Point[] }[] = [{ cell: start, path: [] }];
  const key = ({ x, z }: Point) => `${x},${z}`;
  const seen = new Set([key(start)]);
  for (const { cell, path } of queue) {
    if (Math.abs(cell.x - to.x) + Math.abs(cell.z - to.z) === 1) return path;
    for (const [dx, dz] of [[0, -1], [-1, 0], [1, 0], [0, 1]] as const) {
      const next = { x: cell.x + dx, z: cell.z + dz };
      const id = key(next);
      if (next.x < 1 || next.x > 7 || next.z < 1 || next.z > 8 || blocked.has(id) || seen.has(id)) continue;
      seen.add(id);
      queue.push({ cell: next, path: [...path, next] });
    }
  }
}

export type Placement = Point & { tile: StationId };
const fixed = new Set<StationId>(['S', 'X', 'B', 'P', 'M', 'C', 'L']);
export const movable = stations.filter(({ tile }) => !fixed.has(tile)).map(({ tile }) => tile);

export function configuredStations(placements: Placement[]) {
  return [...stations.filter(({ tile }) => !placements.some((placement) => placement.tile === tile)), ...placements];
}

export function stationFootprint(placements: Placement[]) {
  return [
    ...cells.filter(({ tile }) => isSolid(tile) && !Object.hasOwn(stationNames, tile)),
    ...configuredStations(placements),
  ];
}

export function validLayout(placements: Placement[]) {
  const ids = new Set<StationId>();
  for (const { tile, x, z } of placements) {
    if ((!movable.includes(tile) && tile !== 'K2' && tile !== 'G2') || ids.has(tile) ||
      !Number.isInteger(x) || x < 1 || x > 7 || !Number.isInteger(z) || z < 2 || z > 8 ||
      (z === 8 && (x === 2 || x === 3))) return false;
    ids.add(tile);
  }
  const footprint = stationFootprint(placements);
  const blocked = new Set(footprint.map(({ x, z }) => `${x},${z}`));
  if (blocked.size !== footprint.length) return false;
  return configuredStations(placements).every((station) => [2, 3].every((x) =>
    routeTo({ x, z: 8 }, station, blocked) !== undefined));
}
