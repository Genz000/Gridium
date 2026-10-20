export const IMAGE_TARGET = "content.image";
export const BACKGROUND_TARGET = "appearance.background";

export type ContentSource = "text" | "image";
export type GridPattern = "full" | "bowtie";

/**
 * The letterform (or image) is seen through a grid of square windows. Every window shows the
 * same glyph, slid against the window by Shift X/Y per column/row: 0% repeats the same centre
 * slice in every cell, 100% lines the slices up into the unbroken glyph, anything between breaks it.
 */
export type GridSettings = {
  source: ContentSource;
  text: string;
  size: number;
  ink: string;
  pattern: GridPattern;
  cell: number;
  shiftX: number;
  shiftY: number;
  squeeze: number;
  compression: number;
  rotation: number;
  motion: number;
  speed: number;
};

export const gridDefaults: GridSettings & { background: string } = {
  source: "text",
  text: "A",
  size: 450,
  ink: "#111111",
  pattern: "full",
  cell: 80,
  shiftX: 50,
  shiftY: 50,
  squeeze: 0,
  compression: 0,
  rotation: 0,
  motion: 0,
  speed: 1,
  background: "#FFFFFF",
};

export const contentTargets = ["content.source", "content.text", "content.size", "content.ink"] as const;
export const gridTargets = ["grid.pattern", "grid.cell", "grid.shiftX", "grid.shiftY"] as const;
export const distortTargets = ["distort.squeeze", "distort.compression", "distort.rotation"] as const;
export const motionTargets = ["motion.amount", "motion.speed"] as const;

export function readGridSettings(values: Readonly<Record<string, unknown>>): GridSettings {
  const d = gridDefaults;
  const n = (target: string, fallback: number) => {
    const v = values[target];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  const s = (target: string, fallback: string) => (typeof values[target] === "string" ? (values[target] as string) : fallback);
  return {
    source: values["content.source"] === "image" ? "image" : "text",
    text: s("content.text", d.text),
    size: Math.max(1, n("content.size", d.size)),
    ink: s("content.ink", d.ink),
    pattern: values["grid.pattern"] === "bowtie" ? "bowtie" : "full",
    cell: Math.max(10, n("grid.cell", d.cell)),
    shiftX: n("grid.shiftX", d.shiftX),
    shiftY: n("grid.shiftY", d.shiftY),
    squeeze: n("distort.squeeze", d.squeeze),
    compression: Math.max(0, n("distort.compression", d.compression)),
    rotation: n("distort.rotation", d.rotation),
    motion: Math.max(0, n("motion.amount", d.motion)),
    speed: Math.max(0.1, n("motion.speed", d.speed)),
  };
}

/** Seconds of one seamless motion loop; every wave completes a whole number of cycles in it. */
export const BASE_LOOP_SECONDS = 10;
export const loopSecondsFor = (speed: number) => BASE_LOOP_SECONDS / Math.max(0.1, speed);

/** Largest backing edge the preview allocates. */
export const MAX_BACKING_EDGE = 4096;

/** Preview pixels per scene pixel: twice the on-screen density, capped at MAX_BACKING_EDGE. */
export function backingScale(width: number, height: number, zoom: number, dpr: number): number {
  const wanted = 2 * Math.max(zoom, 0.01) * Math.max(dpr, 1);
  const cap = MAX_BACKING_EDGE / Math.max(width, height, 1);
  return Math.max(0.05, Math.min(wanted, cap));
}
