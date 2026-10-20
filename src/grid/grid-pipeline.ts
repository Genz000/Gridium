import { registerToolcraftRendererPipeline, type ToolcraftRendererPipelinePassContract } from "@/toolcraft/runtime";

import type { GridImage } from "./grid-source";
import { contentTargets, distortTargets, gridTargets, IMAGE_TARGET, motionTargets } from "./grid-settings";

const STAGE = {
  kind: "intrinsic",
  reason: "The grid is generated to fill the canvas frame and every cell clips its glyph, so nothing is drawn outside the frame.",
} as const;

const canvasTargets = ["canvas.size.width", "canvas.size.height"];
const sourceTargets = [IMAGE_TARGET];
const frameTargets = [...contentTargets, ...gridTargets, ...distortTargets, ...motionTargets];
const frameInputs = [...frameTargets, ...canvasTargets, "timeline"];

export const gridPipeline = registerToolcraftRendererPipeline<{
  source: ToolcraftRendererPipelinePassContract<GridImage | null>;
  frame: ToolcraftRendererPipelinePassContract<string>;
  export: ToolcraftRendererPipelinePassContract<void>;
}>()({
  runtimeId: "gridium-v1",
  passes: [
    {
      id: "source", kind: "preprocess", inputs: sourceTargets, invalidatedBy: sourceTargets, cacheKey: ["resources"],
      runsOn: "main", output: "intermediate", quality: "full", sceneBounds: STAGE,
      cost: { dimensions: ["sourcePixels"], relationship: "linear", frequency: "discrete" },
      lifecycle: { cache: "memoized", resourceScope: "source" },
    },
    {
      id: "frame", kind: "composite", inputs: frameInputs, invalidatedBy: frameInputs, cacheKey: ["frame"],
      runsOn: "main", output: "preview", quality: "full", sceneBounds: STAGE,
      cost: { dimensions: ["cells", "pixels"], relationship: "linear", frequency: "frame" },
      lifecycle: { cache: "memoized", resourceScope: "renderer" },
    },
    {
      id: "export", kind: "export", inputs: [...sourceTargets, ...frameInputs, "export.image.resolution", "export.image.format"],
      invalidatedBy: ["export.image", "export.svg"], runsOn: "export-only", output: "export", quality: "export",
      cost: { dimensions: ["cells", "resolution"], relationship: "linear", frequency: "batch" },
      lifecycle: { cache: "none", resourceScope: "call" },
    },
  ],
  interactionInvalidation: [
    { interaction: "initial-render", targets: ["canvas"], invalidates: ["source", "frame"] },
    { interaction: "media-import", targets: [IMAGE_TARGET], invalidates: ["source", "frame"], mustNotInvalidate: [] },
    { interaction: "control-drag", targets: frameTargets.filter((t) => t !== "content.source" && t !== "grid.pattern" && t !== "content.text"), invalidates: ["frame"], mustNotInvalidate: ["source"] },
    { interaction: "control-change", targets: [...frameTargets, ...canvasTargets], invalidates: ["frame"], mustNotInvalidate: ["source"] },
    { interaction: "timeline-playback", targets: ["timeline"], invalidates: ["frame"], mustNotInvalidate: ["source"] },
    {
      interaction: "control-change",
      targets: ["appearance.background", "export.includeBackground", "canvas.infinity", "canvas.workspaceBackground",
        "export.image.format", "export.image.resolution"],
      invalidates: [], mustNotInvalidate: ["source", "frame"],
    },
    { interaction: "viewport-drag", targets: ["canvas"], invalidates: [], mustNotInvalidate: ["source", "frame"] },
    // Zoom changes the supersampled backing resolution once the gesture ends.
    { interaction: "viewport-zoom", targets: ["canvas"], invalidates: ["frame"], mustNotInvalidate: ["source"] },
    { interaction: "export", targets: ["export.image", "export.svg"], invalidates: ["export"], mustNotInvalidate: ["source", "frame"] },
  ],
});

export const sourcePass = gridPipeline.getPass("source");
export const framePass = gridPipeline.getPass("frame");
export const exportPass = gridPipeline.getPass("export");
