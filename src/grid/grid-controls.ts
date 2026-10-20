import type { ToolcraftControlSchema } from "@/toolcraft/runtime";

import { BACKGROUND_TARGET, gridDefaults as d, IMAGE_TARGET } from "./grid-settings";

const always = { applicability: { mode: "always" } } as const;
const live = {
  ...always, performanceRole: "responsiveness",
  performanceReason: "Recomputes the cell layout and redraws every cell of one Canvas 2D frame.",
} as const;
const slider = { sliderValueKind: "continuous" } as const;
const whenText = { applicability: { mode: "conditional", all: [{ target: "content.source", equals: "text" }] } } as const;
const whenImage = { applicability: { mode: "conditional", all: [{ target: "content.source", equals: "image" }] } } as const;

export const backgroundControls = {
  include: { ...live, type: "switch", target: "export.includeBackground", label: "Background", defaultValue: true },
  color: { ...live, type: "color", target: BACKGROUND_TARGET, label: "Background color", defaultValue: d.background },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const contentControls = {
  source: {
    ...live, type: "segmented", target: "content.source", label: "Source", defaultValue: d.source,
    description: "What every cell shows: your text, or an uploaded image.",
    options: [{ label: "Text", value: "text" }, { label: "Image", value: "image" }],
  },
  text: {
    ...whenText, performanceRole: "responsiveness",
    performanceReason: "Recomputes the cell layout and redraws every cell of one Canvas 2D frame.",
    type: "code", textValueKind: "multiline", commitMode: "content", target: "content.text", label: "Text", defaultValue: d.text,
    description: "A letter, a word or several lines; press Enter for a new line. Every cell shows a slice of it.",
  },
  image: {
    ...whenImage, type: "fileDrop", target: IMAGE_TARGET, label: "Image", assetKind: "image", multiple: false, defaultValue: [],
    description: "A picture or logo shown through the grid instead of text. PNG export only; SVG needs text.",
    performanceRole: "workload",
    performanceReason: "A new image is decoded once (long edge up to 2048 px) and then drawn into every cell.",
  },
  size: {
    ...live, ...slider, type: "slider", target: "content.size", label: "Size", defaultValue: d.size,
    min: 20, max: 1500, step: 10, unit: "px", editableRange: { hardMin: 1 },
    description: "Font size of the text, or width of the image, in canvas pixels.",
  },
  ink: {
    ...whenText, performanceRole: "responsiveness",
    performanceReason: "Recomputes the cell layout and redraws every cell of one Canvas 2D frame.",
    type: "color", target: "content.ink", label: "Color", defaultValue: d.ink, description: "Colour of the text.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const gridControls = {
  pattern: {
    ...live, type: "segmented", target: "grid.pattern", label: "Pattern", defaultValue: d.pattern,
    description: "Full fills the canvas with cells. Bowtie keeps the centre row and column and fans out diagonally to both sides.",
    options: [{ label: "Full", value: "full" }, { label: "Bowtie", value: "bowtie" }],
  },
  cell: {
    ...live, ...slider, type: "slider", target: "grid.cell", label: "Cell size", defaultValue: d.cell,
    min: 10, max: 300, step: 1, unit: "px", editableRange: { hardMin: 10 },
    description: "Width and height of each window, in canvas pixels.",
  },
  shiftX: {
    ...live, ...slider, type: "slider", target: "grid.shiftX", label: "Shift X", defaultValue: d.shiftX,
    min: 0, max: 100, step: 1, unit: "%", editableRange: { hardMin: -400, hardMax: 400 },
    description: "How far the glyph slides per column, as a share of the cell. 0% repeats the centre slice in every column, 100% lines the slices up into the whole glyph.",
  },
  shiftY: {
    ...live, ...slider, type: "slider", target: "grid.shiftY", label: "Shift Y", defaultValue: d.shiftY,
    min: 0, max: 100, step: 1, unit: "%", editableRange: { hardMin: -400, hardMax: 400 },
    description: "How far the glyph slides per row, as a share of the cell.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const distortControls = {
  squeeze: {
    ...live, ...slider, type: "slider", target: "distort.squeeze", label: "Squeeze", defaultValue: d.squeeze,
    min: -50, max: 50, step: 1, editableRange: { hardMin: -50, hardMax: 500 },
    description: "Stretches (positive) or flattens (negative) the glyph vertically, strongest on the centre row and fading out over six rows.",
  },
  compression: {
    ...live, ...slider, type: "slider", target: "distort.compression", label: "Compression", defaultValue: d.compression,
    min: 0, max: 100, step: 1, editableRange: { hardMin: 0 },
    description: "Flattens the glyph more the further a cell is from the centre.",
  },
  rotation: {
    ...live, ...slider, type: "slider", target: "distort.rotation", label: "Rotation", defaultValue: d.rotation,
    min: 0, max: 50, step: 1, editableRange: { hardMin: -500, hardMax: 500 },
    description: "Turns the glyph inside each cell, more the further the cell is from the centre.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;

export const motionControls = {
  amount: {
    ...live, ...slider, type: "slider", target: "motion.amount", label: "Random motion", defaultValue: d.motion,
    min: 0, max: 100, step: 1, editableRange: { hardMin: 0 },
    description: "Each cell drifts its glyph along its own waves while the timeline plays. 0 keeps the grid still.",
  },
  speed: {
    ...live, ...slider, type: "slider", target: "motion.speed", label: "Speed", defaultValue: d.speed,
    min: 0.1, max: 5, step: 0.1, unit: "×", editableRange: { hardMin: 0.1 },
    description: "Playback speed of the motion; the loop lasts 10 s at 1× and stays seamless at every speed.",
  },
} as const satisfies Record<string, ToolcraftControlSchema>;
