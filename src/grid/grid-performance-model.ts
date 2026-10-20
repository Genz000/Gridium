import type { ToolcraftEnvelopePerformanceConfig, ToolcraftPerformanceFixtureAdapter } from "@/toolcraft/runtime";

import { gridPipeline } from "./grid-pipeline";
import { SOURCE_MAX_EDGE } from "./grid-source";

const numeric = (dimensionId: string): ToolcraftPerformanceFixtureAdapter => ({ dimensionId, apply: (value) => value, observe: (value) => Number(value) });
const resolutionValues: Record<string, number> = { "2k": 2048, "4k": 4096, "8k": 8192 };

export const gridPerformanceModel = {
  usesCustomRenderer: true,
  rendererStrategy: "canvas-2d",
  rendererPipeline: gridPipeline,
  scenarios: [],
  rendererTechnique: {
    sourceRepresentation: "procedural-data",
    productRepresentation: "vector",
    previewRenderer: "canvas-2d",
    exportRenderer: "svg",
    rendererStrategy: "canvas-2d",
    previewExportDifferenceReason: "Preview and PNG draw the cells with Canvas 2D for fast playback; SVG export writes the same cells as clipped uses of one live text element.",
    whyNotAlternativeStrategies: [
      "An SVG DOM preview would re-layout hundreds of clipped nodes on every playback frame.",
      "WebGL would need text rasterised into a texture and gains nothing for a few hundred clipped glyph draws.",
    ],
    fidelityRisks: [
      "SVG text uses the viewer's Helvetica or Arial, so glyph shapes can differ slightly between machines.",
    ],
    performanceRisks: [
      "Cost is one clipped glyph draw per visible cell per frame; small cells on a large canvas raise the count.",
    ],
    layers: [
      { id: "grid", kind: "product-foreground", content: ["text", "bitmap-media", "dense-pattern"], renderer: "canvas-2d", primitiveCount: "high", exportMode: "included", uiSelector: '[data-testid="grid-output"]' },
    ],
  },
  workloadEnvelope: {
    dimensions: [
      { id: "sourcePixels", unit: "source pixels", source: { kind: "schema-target", target: "content.image" }, mapping: "area", defaultValue: SOURCE_MAX_EDGE * SOURCE_MAX_EDGE, interactiveMax: SOURCE_MAX_EDGE * SOURCE_MAX_EDGE, batchMax: SOURCE_MAX_EDGE * SOURCE_MAX_EDGE },
      { id: "cells", unit: "visible cells", source: { kind: "external-input", id: "grid-cells" }, mapping: "direct", defaultValue: 300, interactiveMax: 20000, batchMax: 170000 },
      { id: "pixels", unit: "backing pixels", source: { kind: "external-input", id: "canvas-backing" }, mapping: "area", defaultValue: 2400 * 2400, interactiveMax: 4096 * 4096, batchMax: 4096 * 4096 },
      { id: "resolution", unit: "long-edge pixels", source: { kind: "schema-target", target: "export.image.resolution" }, mapping: "area", defaultValue: 4096, batchMax: 8192 },
    ],
  },
  fixtureAdapters: {
    dimensions: {
      sourcePixels: numeric("sourcePixels"),
      cells: numeric("cells"),
      pixels: numeric("pixels"),
      resolution: {
        dimensionId: "resolution", kind: "exhaustive-discrete",
        domain: { kind: "schema-options", target: "export.image.resolution", optionValues: ["2k", "4k", "8k"] },
        entries: Object.entries(resolutionValues).map(([appliedValue, value]) => ({ appliedValue, value })),
        apply: (value) => Object.keys(resolutionValues).find((key) => resolutionValues[key] === value)!,
        observe: (value) => resolutionValues[String(value)]!,
      },
    },
  },
} as const satisfies ToolcraftEnvelopePerformanceConfig;
