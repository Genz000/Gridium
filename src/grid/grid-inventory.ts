import type {
  ToolcraftControlSectionInventoryEntry, ToolcraftProductReadiness, ToolcraftTransferMode,
} from "../app/acceptance/types";

import { contentTargets, distortTargets, gridDefaults, gridTargets, IMAGE_TARGET, loopSecondsFor, motionTargets } from "./grid-settings";

/** The user's request in this session, verbatim. */
export const ORIGINAL_REQUEST_TEXT =
  "Yes, build my own version of this grid-shift type tool as a new project in Desktop/Claudio, written from scratch in my own style with the same core effect and controls, plus SVG/PNG export. use toolcraft";
const SESSION_REF = "C:/Users/pc/.claude/projects/C--Users-pc-Desktop-Claudio/c801c3bf-34f6-417a-86fc-af6add9efa67.jsonl";

export const gridTransferMode: ToolcraftTransferMode = {
  mode: "new-toolcraft-app",
  referenceInputs: [],
  animationIntent: {
    mode: "timeline-playback",
    loopDuration: {
      seconds: loopSecondsFor(gridDefaults.speed),
      source: "product-derived",
      evidence: "Random motion is a sum of waves that each complete a whole number of cycles per loop; the loop lasts 10 s divided by Speed.",
    },
  },
};

export const gridSectionInventory = [
  {
    id: "runtime.setup", title: "Settings", entityId: "background", entity: "Output background",
    targets: ["export.includeBackground", "appearance.background"],
    groupingReason: "One output background; runtime relocates this source pair into Settings.",
    finiteSelectors: [{ target: "export.includeBackground", role: "parameter", reason: "Controls background visibility and PNG/SVG transparency; the colour stays editable in both states." }],
  },
  {
    id: "content", title: "Content", entityId: "content", entity: "Glyph content", targets: [...contentTargets, IMAGE_TARGET],
    groupingReason: "What is seen through the grid: the text or image, its size and colour.",
    finiteSelectors: [{ target: "content.source", role: "branch", affectedTargets: ["content.size"], reason: "Text reveals Text and Color, Image reveals the upload; Size applies to whichever is shown." }],
  },
  {
    id: "grid", title: "Grid", entityId: "grid", entity: "Grid windows", targets: [...gridTargets],
    groupingReason: "The windows and how far the glyph slides against them per column and row: the core of the effect.",
    finiteSelectors: [{ target: "grid.pattern", role: "parameter", reason: "Full or Bowtie only changes which cells are drawn." }],
  },
  {
    id: "distort", title: "Distort", entityId: "distort", entity: "Per-cell distortion", targets: [...distortTargets],
    groupingReason: "Vertical stretch and turn of the glyph inside each cell, growing with the distance from the centre.",
    finiteSelectors: [],
  },
  {
    id: "motion", title: "Motion", entityId: "motion", entity: "Random motion", targets: [...motionTargets],
    groupingReason: "The drift of each cell's glyph over the playback loop; the timeline owns transport.",
    finiteSelectors: [],
  },
  {
    id: "runtime.image-export", title: "Image Export", entityId: "image-export", entity: "Still image output",
    targets: ["export.image.format", "export.image.resolution"], groupingReason: "Runtime-owned still format (PNG, JPG or SVG) and raster resolution govern one exported artifact.",
    finiteSelectors: [
      { target: "export.image.format", role: "branch", affectedTargets: [], reason: "Selects PNG, JPG or editable SVG; SVG hides the raster resolution." },
      { target: "export.image.resolution", role: "parameter", reason: "Selects the raster long-edge pixel size." },
    ],
  },
] as const satisfies readonly ToolcraftControlSectionInventoryEntry[];

const panelProperty = (target: string) => ({
  id: `${target}-property`, target, capability: "property-edit" as const, surface: "panel" as const,
  selectionScope: { mode: "global" as const },
  evidence: { source: "reference" as const, detail: "The inspected grid-shift tool sets every value from sliders and toggles in a side panel." },
  reason: "A global setting of the whole grid with no selected entity.",
  alternative: { surface: "canvas" as const, reason: "Canvas handles would cover the type being judged and have no spatial meaning for these values." },
});

export const gridReadiness: ToolcraftProductReadiness = {
  mode: "product",
  productName: "Gridium",
  productSummary: "Grid-shift type tool: text or an image seen through a grid of windows that each slide, squeeze and turn the glyph, with optional looping motion and PNG or editable SVG export.",
  requestedBehavior: ORIGINAL_REQUEST_TEXT,
  exportIntent: {
    image: { mode: "toolcraft-default" },
    svg: {
      mode: "user-requested",
      evidence: { source: "user-message", messageRef: SESSION_REF, messageText: ORIGINAL_REQUEST_TEXT, quote: "plus SVG/PNG export" },
    },
    video: { mode: "not-requested" },
  },
  viewInteraction: { mode: "non-spatial", reason: "The output is flat 2D type with no camera or 3D scene." },
  interactionOwnership: [
    {
      id: "content.image-collection", target: IMAGE_TARGET, capability: "collection-edit", surface: "panel",
      evidence: { source: "reference", detail: "The inspected tool picks the image from a panel toggle and file picker." },
      reason: "Uploading and removing the image is file management, not spatial editing.",
      alternative: { surface: "canvas", reason: "Upload chrome on the canvas would cover the grid." },
    },
    ...[...contentTargets, ...gridTargets, ...distortTargets, ...motionTargets].map(panelProperty),
  ],
};
