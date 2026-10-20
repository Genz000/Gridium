import { describe, expect, it } from "vitest";

import { cellTransform } from "./grid-export";
import { inPattern, layoutGrid, textLines } from "./grid-layout";
import { gridDefaults, loopSecondsFor, readGridSettings } from "./grid-settings";

const base = readGridSettings({});

describe("grid layout", () => {
  it("centres one cell on the frame and covers the whole frame", () => {
    const cells = layoutGrid(base, 1600, 1200, 0);
    const centre = cells.find((c) => c.col === 0 && c.row === 0)!;
    expect(centre.x + centre.size / 2).toBe(800);
    expect(centre.y + centre.size / 2).toBe(600);
    expect(Math.min(...cells.map((c) => c.x))).toBeLessThanOrEqual(0);
    expect(Math.max(...cells.map((c) => c.x + c.size))).toBeGreaterThanOrEqual(1600);
    expect(Math.min(...cells.map((c) => c.y))).toBeLessThanOrEqual(0);
    expect(Math.max(...cells.map((c) => c.y + c.size))).toBeGreaterThanOrEqual(1200);
  });

  it("slides the glyph by Shift X/Y per column and row", () => {
    const at = (shift: number) => layoutGrid({ ...base, shiftX: shift, shiftY: shift }, 800, 800, 0).find((c) => c.col === 2 && c.row === -1)!;
    expect(at(0)).toMatchObject({ ox: 0, oy: 0 });
    expect(at(50)).toMatchObject({ ox: -80, oy: 40 });
    // 100%: the glyph centre stays on the frame centre in every cell, so the slices line up.
    const whole = at(100);
    expect(whole.x + whole.size / 2 + whole.ox).toBe(400);
    expect(whole.y + whole.size / 2 + whole.oy).toBe(400);
  });

  it("keeps the centre row, centre column and outer diagonals in Bowtie", () => {
    expect(inPattern("bowtie", 0, 5)).toBe(true);
    expect(inPattern("bowtie", 3, 0)).toBe(true);
    expect(inPattern("bowtie", 3, 2)).toBe(true);
    expect(inPattern("bowtie", 2, 2)).toBe(false);
    expect(inPattern("bowtie", -1, 3)).toBe(false);
    expect(layoutGrid({ ...base, pattern: "bowtie" }, 800, 800, 0).length).toBeLessThan(layoutGrid(base, 800, 800, 0).length);
  });

  it("squeezes the centre row most and fades over six rows", () => {
    const cells = layoutGrid({ ...base, squeeze: 50 }, 1600, 1600, 0);
    const row = (r: number) => cells.find((c) => c.col === 0 && c.row === r)!.scaleY;
    expect(row(0)).toBeCloseTo(2);
    expect(row(3)).toBeCloseTo(1.5);
    expect(row(6)).toBe(1);
    expect(layoutGrid({ ...base, squeeze: -50 }, 800, 800, 0).find((c) => c.row === 0 && c.col === 0)!.scaleY).toBeCloseTo(0.01);
  });

  it("compresses and turns cells by their distance from the centre", () => {
    const cells = layoutGrid({ ...base, compression: 5, rotation: 10 }, 1600, 1600, 0);
    const centre = cells.find((c) => c.col === 0 && c.row === 0)!;
    const far = cells.find((c) => c.col === 3 && c.row === 4)!;
    expect(centre).toMatchObject({ rotation: 0, scaleY: 1 });
    expect(far.rotation).toBeCloseTo(40);
    expect(far.scaleY).toBeCloseTo(1 - 5 * 5 * 0.015);
  });

  it("loops Random motion seamlessly and keeps the grid still without it", () => {
    const moving = { ...base, motion: 40 };
    const start = layoutGrid(moving, 800, 800, 0);
    const end = layoutGrid(moving, 800, 800, 1);
    const mid = layoutGrid(moving, 800, 800, 0.37);
    start.forEach((cell, i) => {
      expect(end[i]!.ox).toBeCloseTo(cell.ox, 6);
      expect(end[i]!.oy).toBeCloseTo(cell.oy, 6);
    });
    expect(mid.some((cell, i) => Math.abs(cell.ox - start[i]!.ox) > 1)).toBe(true);
    expect(layoutGrid(base, 800, 800, 0.37)).toEqual(layoutGrid(base, 800, 800, 0));
    expect(loopSecondsFor(1)).toBe(10);
    expect(loopSecondsFor(2)).toBe(5);
  });

  it("stacks text lines around the glyph centre", () => {
    expect(textLines("A", 100)).toEqual([{ text: "A", y: 0 }]);
    const lines = textLines("AB\nCD\nEF", 100);
    expect(lines.map((l) => Math.round(l.y))).toEqual([-110, 0, 110]);
  });

  it("writes the SVG cell transform in canvas draw order", () => {
    const cell = layoutGrid({ ...base, rotation: 10, squeeze: 20 }, 800, 800, 0).find((c) => c.col === 1 && c.row === 0)!;
    expect(cellTransform(cell, 40)).toBe("translate(40 40) rotate(8) scale(1 1.4) translate(-40 0)");
  });

  it("falls back to defaults for missing or invalid values", () => {
    expect(readGridSettings({ "grid.cell": 2, "content.size": Number.NaN, "content.source": "video" })).toMatchObject({
      cell: 10, size: gridDefaults.size, source: "text",
    });
  });
});
