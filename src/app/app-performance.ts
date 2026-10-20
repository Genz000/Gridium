import { defineToolcraftPerformance, deriveToolcraftPerformancePaths, type ToolcraftPerformanceScenario } from "@/toolcraft/runtime";

import { gridPerformanceModel } from "../grid/grid-performance-model";
import { appSchema } from "./app-schema";

export const gridPerformancePaths = deriveToolcraftPerformancePaths(appSchema, gridPerformanceModel);

export const appPerformance = defineToolcraftPerformance({
  ...gridPerformanceModel,
  scenarios: gridPerformancePaths.map((path, index): ToolcraftPerformanceScenario => ({
    id: `grid-path-${index}`, pathId: path.id, coversTargets: path.targets, interaction: path.interaction,
    automated: true, automatedTestName: "grid render plan has valid derived paths and fixtures",
    browser: true, browserTestName: `browser perf: toolcraft path ${path.id}`,
    expectedObservable: "The grid preview, viewport or decoded artifact reflects the exact applied operation.",
    fixture: "Compiled reachable grid workload", uiSelector: '[data-testid="grid-output"]',
    ...(path.interaction === "export" ? { actionValue: "export.png", controlLabel: "Export PNG", completionEvidence: "download" as const } : {}),
  } as ToolcraftPerformanceScenario)),
});
