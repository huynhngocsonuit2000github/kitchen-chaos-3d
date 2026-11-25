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
  R: 'Plate rack', X: 'Waste bin',
};
export type StationId = keyof typeof stationNames;
export type Point = { x: number; z: number };
export const cells = layout.flatMap((row, z) => Array.from(row, (tile, x) => ({ tile, x, z })));
export const stations = cells.filter((cell): cell is Point & { tile: StationId } =>
  Object.hasOwn(stationNames, cell.tile));
export const isSolid = (tile: string) => !'.12D'.includes(tile);
