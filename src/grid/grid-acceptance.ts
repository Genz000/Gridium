import type { ToolcraftComponentAcceptance } from "../app/acceptance/types";
import { appSchema } from "../app/app-schema";

import { contentControls, distortControls, gridControls, motionControls } from "./grid-controls";
import { IMAGE_TARGET } from "./grid-settings";

type Budget = "standard" | "extended-io";
type Row = ToolcraftComponentAcceptance;

const FOOTER = "actions.output";

const browser = (file: string, testName: string, budget: Budget = "standard") =>
  ({ file: `e2e/${file}.spec.ts` as `e2e/${string}.spec.ts`, testName, budget });

const optionsOf = (control: { options?: readonly { value: string }[] }) => control.options?.map((o) => o.value);

const { image: _image, ...contentValueControls } = contentControls;
const productControls = { ...contentValueControls, ...gridControls, ...distortControls, ...motionControls };

const controlRows: Row[] = Object.values(productControls).map((control) => {
  const options = "options" in control ? optionsOf(control) : undefined;
  const target = control.target;
  return {
    id: target, target, kind: "control", componentType: control.type, interactionId: `${target}-property`,
    automated: true, automatedTestName: `grid parameter ${target}`,
    browser: browser("product-grid-controls", `browser: grid parameter ${target}`),
    evidence: "product-output",
    fixture: target.startsWith("motion.") ? "Default text with Random motion above 0, playback paused at a fixed time." : "Default text settings.",
    userAction: `Change ${control.label} through the real control.`,
    expectedObservable: "The grid canvas pixels change according to the setting.",
    ...(options ? { optionCoverage: options } : {}),
  } satisfies Row;
});

const runtimeRow = (id: string, target: string, evidence: Row["evidence"], file: string, testName: string, extra: Partial<Row>, budget: Budget = "standard"): Row => ({
  id, target, kind: "runtime", componentType: id, automated: true, automatedTestName: `grid contract ${id}`,
  browser: browser(file, testName, budget), evidence,
  fixture: "Default text settings and real Toolcraft controls.",
  userAction: `Exercise ${id} through the visible UI.`,
  expectedObservable: `The grid output and runtime workspace implement ${id}.`,
  ...extra,
});

export const gridAcceptance: readonly Row[] = [
  {
    id: IMAGE_TARGET, target: IMAGE_TARGET, kind: "control", componentType: "fileDrop", interactionId: "content.image-collection",
    automated: true, automatedTestName: "grid contract content.image",
    browser: browser("product-grid-image", "browser: grid image upload, clear and reset", "extended-io"),
    evidence: "media-lifecycle", mediaLifecycleCoverage: ["upload", "remove", "reset"],
    fixture: "Source set to Image and a logo PNG.",
    userAction: "Upload the image, then remove it and use section Reset.",
    expectedObservable: "The image appears sliced through the grid after upload and the canvas is empty after removal.",
  },
  ...controlRows,
  {
    ...controlRows[0]!, id: "appearance.background", target: "appearance.background", componentType: "color", interactionId: undefined,
    automatedTestName: "grid contract appearance.background",
    browser: browser("product-grid-background", "browser: grid background color changes output"),
    userAction: "Change Background color.", optionCoverage: undefined,
  },
  runtimeRow("background.output", "export.includeBackground", "product-output", "product-grid-background",
    "browser: grid background output follows runtime semantics",
    { kind: "control", componentType: "switch", backgroundOutputCoverage: "all-required-background-output" }),
  {
    id: "export.image.format", target: "export.image.format", kind: "control", componentType: "select",
    automated: true, automatedTestName: "grid contract export.image.format",
    browser: browser("product-grid-export", "browser: grid still export delivers PNG, JPG and SVG", "extended-io"),
    evidence: "exported-bytes", optionCoverage: ["png", "jpg", "svg"],
    fixture: "Default text settings.", userAction: "Select each format and export.",
    expectedObservable: "The downloaded file has the selected format; SVG holds one live text element and one clipped use per cell.",
  },
  {
    id: "export.image.resolution", target: "export.image.resolution", kind: "control", componentType: "select",
    automated: true, automatedTestName: "grid contract export.image.resolution",
    browser: browser("product-grid-export", "browser: grid still export delivers PNG, JPG and SVG", "extended-io"),
    evidence: "exported-bytes", optionCoverage: ["2k", "4k", "8k"],
    fixture: "Default text settings.", userAction: "Select each resolution and export PNG.",
    expectedObservable: "The PNG long edge matches the selected resolution.",
  },
  runtimeRow("export.image", FOOTER, "exported-bytes", "product-grid-export",
    "browser: grid still export delivers PNG, JPG and SVG",
    { componentType: "panelActions", actionCoverage: ["export.png"], exportArtifactCoverage: "all-required-image-export-behavior", infinityCanvasCoverage: "scene-bounds-image-export" }, "extended-io"),
  runtimeRow("export.svg", FOOTER, "exported-bytes", "product-grid-export",
    "browser: grid still export delivers PNG, JPG and SVG",
    { componentType: "panelActions", actionCoverage: ["export.svg"], exportArtifactCoverage: "all-required-svg-export-behavior", infinityCanvasCoverage: "scene-bounds-svg-export" }, "extended-io"),
  runtimeRow("export.actions", FOOTER, "exported-bytes", "product-grid-export",
    "browser: grid footer exports PNG and SVG",
    {
      kind: "control", componentType: "panelActions", actionCoverage: ["export.png", "export.svg"],
      exportArtifactCoverage: ["all-required-image-export-behavior", "all-required-svg-export-behavior"],
    }, "extended-io"),
  runtimeRow("timeline.playback", "timeline", "timeline-output", "product-grid-timeline",
    "browser: grid timeline plays, scrubs and loops the motion",
    {
      timelineCoverage: "playback", timelinePlaybackCoverage: "all-playback-behavior",
      timelineLoopProof: { direction: "forward-only", reversePlayback: "forbidden", seam: "first-last-match", durationChange: "reproved-after-edit" },
    }),
  runtimeRow("canvas.size", "canvas.size.width", "product-output", "product-grid-workspace",
    "browser: grid canvas sizing changes output", {}),
  runtimeRow("canvas.infinity", "canvas.infinity", "viewport-side-effect", "product-grid-workspace",
    "browser: grid infinity preserves scene and viewport", { infinityCanvasCoverage: "mode-continuity-and-restoration" }),
  runtimeRow("persistence.reload", "canvas.size.width", "persistence-state", "product-grid-persistence",
    "browser: grid restores values and workspace after reload",
    { persistenceCoverage: "reload", persistenceSlices: appSchema.persistence.storage === "localStorage" ? appSchema.persistence.include : [] }, "extended-io"),
];
