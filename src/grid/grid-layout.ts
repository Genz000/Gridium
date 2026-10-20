import type { GridSettings } from "./grid-settings";

/**
 * One window of the grid in scene pixels. The glyph is drawn about the cell centre: translate to
 * (cx, cy), rotate by `rotation` degrees, scale y by `scaleY`, then place the glyph centre at (ox, oy).
 * Everything is clipped to the square (x, y, size).
 */
export type GridCell = {
  col: number;
  row: number;
  x: number;
  y: number;
  size: number;
  ox: number;
  oy: number;
  rotation: number;
  scaleY: number;
};

/** Rows over which Squeeze fades from full strength at the centre row to nothing. */
const SQUEEZE_ROWS = 6;

/** Wave harmonics of Random motion: cycles per loop, relative amplitude. Whole cycles keep the loop seamless. */
const WAVES_X = [[1, 1.5], [2, 1], [3, 0.6], [5, 0.3]] as const;
const WAVES_Y = [[1, 1.2], [2, 0.9], [4, 0.5], [6, 0.3]] as const;

/** Deterministic 0..1 value per cell and channel. */
function hash(col: number, row: number, channel: number): number {
  const v = Math.sin(col * 127.1 + row * 311.7 + channel * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

function wave(col: number, row: number, axis: number, progress: number, waves: readonly (readonly [number, number])[]): number {
  let sum = 0;
  for (let i = 0; i < waves.length; i += 1) {
    const [cycles, amp] = waves[i]!;
    sum += amp * Math.sin(2 * Math.PI * (cycles * progress + hash(col, row, axis * 8 + i)));
  }
  return sum;
}

export function inPattern(pattern: GridSettings["pattern"], col: number, row: number): boolean {
  if (pattern === "full") return true;
  // Bowtie: the centre row fans out diagonally to both sides, the centre column runs top to bottom.
  return col === 0 || Math.abs(col) > Math.abs(row);
}

/**
 * Every cell that touches the width × height frame. The centre cell sits on the frame centre;
 * `progress` is the loop position 0..1 and only matters when Random motion is above 0.
 */
export function layoutGrid(settings: GridSettings, width: number, height: number, progress: number): GridCell[] {
  const s = settings.cell;
  const cx = width / 2;
  const cy = height / 2;
  const cols = Math.ceil((width / 2 - s / 2) / s);
  const rows = Math.ceil((height / 2 - s / 2) / s);
  const kx = settings.shiftX / 100;
  const ky = settings.shiftY / 100;
  const squeeze = Math.abs(settings.squeeze) * 0.02 * Math.sign(settings.squeeze);
  const motion = settings.motion;
  const cells: GridCell[] = [];
  for (let row = -rows; row <= rows; row += 1) {
    for (let col = -cols; col <= cols; col += 1) {
      if (!inPattern(settings.pattern, col, row)) continue;
      const distance = Math.hypot(col, row);
      let scaleY = 1 + squeeze * Math.max(0, (SQUEEZE_ROWS - Math.abs(row)) / SQUEEZE_ROWS);
      if (settings.compression > 0) scaleY *= Math.max(0.1, 1 - distance * settings.compression * 0.015);
      const mx = motion > 0 ? motion * wave(col, row, 0, progress, WAVES_X) : 0;
      const my = motion > 0 ? motion * wave(col, row, 1, progress, WAVES_Y) : 0;
      cells.push({
        col, row,
        x: cx - s / 2 + col * s,
        y: cy - s / 2 + row * s,
        size: s,
        ox: -col * s * kx + mx + 0,
        oy: -row * s * ky + my + 0,
        rotation: distance * settings.rotation * 0.8,
        scaleY: Math.max(0.01, scaleY),
      });
    }
  }
  return cells;
}

/** Text lines and their vertical centres around the glyph centre. */
export function textLines(text: string, size: number): { text: string; y: number }[] {
  const lines = (text.length > 0 ? text : " ").split(/\r?\n/);
  const leading = size * 1.1;
  return lines.map((line, i) => ({ text: line, y: (i - (lines.length - 1) / 2) * leading }));
}

/** Image drawn Size pixels wide, keeping its aspect ratio. */
export function imageBox(size: number, width: number, height: number): { width: number; height: number } {
  return { width: size, height: size * (height / Math.max(1, width)) };
}

export const round = (v: number) => Math.round(v * 100) / 100;
